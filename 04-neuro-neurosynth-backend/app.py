# app.py
from flask import Flask, jsonify, abort, send_file
import os
from sqlalchemy import create_engine, text
from sqlalchemy.engine import URL
from sqlalchemy.exc import OperationalError

# from dotenv import load_dotenv
# load_dotenv() # 在本地執行，請將你的 database URL 放在 .env 裡
_engine = None

def get_engine():
    global _engine
    if _engine is not None:
        return _engine
    db_url = os.getenv("DB_URL")
    if not db_url:
        raise RuntimeError("Missing DB_URL (or DATABASE_URL) environment variable.")
    # Normalize old 'postgres://' scheme to 'postgresql://'
    if db_url.startswith("postgres://"):
        db_url = "postgresql://" + db_url[len("postgres://"):]
    _engine = create_engine(
        db_url,
        pool_pre_ping=True,
    )
    return _engine

def create_app():
    app = Flask(__name__)

    @app.get("/", endpoint="health")
    def health():
        return "<p>Server working!</p>"

    @app.get("/img", endpoint="show_img")
    def show_img():
        return send_file("amygdala.gif", mimetype="image/gif")

    @app.get("/terms/<term>/studies", endpoint="terms_studies")
    def get_studies_by_term(term):
        return term

    @app.get("/locations/<coords>/studies", endpoint="locations_studies")
    def get_studies_by_coordinates(coords):
        x, y, z = map(int, coords.split("_"))
        return jsonify([x, y, z])

    @app.get("/test_db", endpoint="test_db")
    
    def test_db():
        eng = get_engine()
        payload = {"ok": False, "dialect": eng.dialect.name}

        try:
            with eng.begin() as conn:
                # Ensure we are in the correct schema
                conn.execute(text("SET search_path TO ns, public;"))
                payload["version"] = conn.exec_driver_sql("SELECT version()").scalar()

                # Counts
                payload["coordinates_count"] = conn.execute(text("SELECT COUNT(*) FROM ns.coordinates")).scalar()
                payload["metadata_count"] = conn.execute(text("SELECT COUNT(*) FROM ns.metadata")).scalar()
                payload["annotations_terms_count"] = conn.execute(text("SELECT COUNT(*) FROM ns.annotations_terms")).scalar()

                # Samples
                try:
                    rows = conn.execute(text(
                        "SELECT study_id, ST_X(geom) AS x, ST_Y(geom) AS y, ST_Z(geom) AS z FROM ns.coordinates LIMIT 3"
                    )).mappings().all()
                    payload["coordinates_sample"] = [dict(r) for r in rows]
                except Exception:
                    payload["coordinates_sample"] = []

                try:
                    # Select a few columns if they exist; otherwise select a generic subset
                    rows = conn.execute(text("SELECT * FROM ns.metadata LIMIT 3")).mappings().all()
                    payload["metadata_sample"] = [dict(r) for r in rows]
                except Exception:
                    payload["metadata_sample"] = []

                try:
                    rows = conn.execute(text(
                        "SELECT study_id, contrast_id, term, weight FROM ns.annotations_terms LIMIT 3"
                    )).mappings().all()
                    payload["annotations_terms_sample"] = [dict(r) for r in rows]
                except Exception:
                    payload["annotations_terms_sample"] = []

            payload["ok"] = True
            return jsonify(payload), 200

        except Exception as e:
            payload["error"] = str(e)
            return jsonify(payload), 500


    @app.get("/dissociate/terms/<term_a>/<term_b>", endpoint="dissociate_terms")
    def dissociate_terms(term_a, term_b):
        eng = get_engine()
        # 構造完整的 term 名稱（根據你的資料格式）
        full_term_a = f"terms_abstract_tfidf__{term_a}"
        full_term_b = f"terms_abstract_tfidf__{term_b}"
        
        payload = {
            "ok": False,
            "term_a": term_a,
            "term_b": term_b
        }

        try:
            with eng.begin() as conn:
                conn.execute(text("SET search_path TO ns, public;"))

                # 查詢有 term_a 但沒有 term_b 的 study_id
                try:
                    rows = conn.execute(
                        text("""
                            SELECT DISTINCT at1.study_id
                            FROM ns.annotations_terms at1
                            WHERE at1.term = :term_a
                            AND NOT EXISTS (
                                SELECT 1
                                FROM ns.annotations_terms at2
                                WHERE at2.study_id = at1.study_id
                                    AND at2.term = :term_b
                            )
                            LIMIT 50
                        """),
                        {"term_a": full_term_a, "term_b": full_term_b}
                    ).fetchall()
                    study_ids = [r[0] for r in rows]
                    payload["study_ids"] = study_ids
                except Exception as e:
                    payload["study_ids"] = []
                    payload["query_error"] = str(e)

                # 查詢對應的 metadata
                try:
                    if study_ids:
                        meta_rows = conn.execute(
                            text("SELECT study_id, title, year FROM ns.metadata WHERE study_id = ANY(:ids)"),
                            {"ids": study_ids}
                        ).mappings().all()
                        payload["studies"] = [dict(r) for r in meta_rows]
                    else:
                        payload["studies"] = []
                except Exception as e:
                    payload["studies"] = []
                    payload["meta_error"] = str(e)

            payload["ok"] = True
            return jsonify(payload), 200

        except Exception as e:
            payload["error"] = str(e)
            return jsonify(payload), 500

    @app.get("/dissociate/locations/<coords_a>/<coords_b>", endpoint="dissociate_locations")
    def dissociate_locations(coords_a, coords_b):
        eng = get_engine()
        payload = {"ok": False, "coords_a": coords_a, "coords_b": coords_b}
        try:
            x1, y1, z1 = map(float, coords_a.split("_"))
            x2, y2, z2 = map(float, coords_b.split("_"))
            with eng.begin() as conn:
                conn.execute(text("SET search_path TO ns, public;"))
                # 查詢同時有 coords_a 但沒有 coords_b 的 study_id
                rows = conn.execute(text("""
                    SELECT DISTINCT c1.study_id
                    FROM ns.coordinates c1
                    WHERE ST_X(c1.geom) = :x1 AND ST_Y(c1.geom) = :y1 AND ST_Z(c1.geom) = :z1
                    AND c1.study_id NOT IN (
                        SELECT c2.study_id FROM ns.coordinates c2
                        WHERE ST_X(c2.geom) = :x2 AND ST_Y(c2.geom) = :y2 AND ST_Z(c2.geom) = :z2
                    )
                    LIMIT 50
                """), {"x1": x1, "y1": y1, "z1": z1, "x2": x2, "y2": y2, "z2": z2}).fetchall()
                study_ids = [r[0] for r in rows]
                payload["study_ids"] = study_ids

                # 查詢 metadata（只選有的欄位）
                try:
                    if study_ids:
                        meta_rows = conn.execute(
                            text("SELECT study_id, title, year FROM ns.metadata WHERE study_id = ANY(:ids)"),
                            {"ids": study_ids}
                        ).mappings().all()
                        payload["studies"] = [dict(r) for r in meta_rows]
                    else:
                        payload["studies"] = []
                except Exception as e:
                    payload["studies"] = []
                    payload["meta_error"] = str(e)

            payload["ok"] = True
            return jsonify(payload), 200
        except Exception as e:
            payload["error"] = str(e)
            return jsonify(payload), 500
    
    return app

# WSGI entry point (no __main__)
app = create_app()
