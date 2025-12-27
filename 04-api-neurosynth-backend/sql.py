import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
# 測試term的SQL查詢程式

# 載入環境變數
load_dotenv()

# 設定資料庫連線
db_url = os.getenv("DB_URL") or os.getenv("DATABASE_URL")
if not db_url:
    raise RuntimeError("請先設定 DB_URL/DATABASE_URL 環境變數")

# 相容 Heroku 的 postgres:// 開頭（SQLAlchemy 要求 postgresql://）
if db_url.startswith("postgres://"):
    db_url = "postgresql://" + db_url[len("postgres://"):]

engine = create_engine(db_url, pool_pre_ping=True)


def search_terms_by_keyword(keyword: str, exact: bool = False, limit: int = None):
    """
    在 ns.annotations_terms 表中搜尋 term。
    
    Args:
        keyword: 要搜尋的關鍵字（模糊）或完整 term（精確）
        exact: 是否進行精確匹配
        limit: 限制回傳筆數（可選）
    
    Returns:
        List[dict]: 符合條件的記錄列表
    """
    with engine.connect() as conn:
        if exact:
            base_query = """
                SELECT study_id, contrast_id, term, weight
                FROM ns.annotations_terms
                WHERE term = :term
            """
            params = {"term": keyword}
        else:
            base_query = """
                SELECT study_id, contrast_id, term, weight
                FROM ns.annotations_terms
                WHERE term LIKE :pattern
            """
            params = {"pattern": f"%{keyword}%"}
        
        if limit is not None:
            base_query += " LIMIT :limit"
            params["limit"] = limit

        result = conn.execute(text(base_query), params)
        rows = result.mappings().all()
        return [dict(row) for row in rows]


# 使用範例
if __name__ == "__main__":
    # 搜尋所有包含 'cortices' 的 term，最多 5 筆
    results = search_terms_by_keyword("cortices", exact=False, limit=5)
    for r in results:
       print(r)

    # 精確搜尋
    # exact_results = search_terms_by_keyword("terms_abstract_tfidf__cortices", exact=True)
    # print("精確匹配結果:", exact_results)