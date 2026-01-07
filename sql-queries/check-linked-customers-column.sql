-- 檢查 linked_customers 欄位是否存在
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'customer_interactions'
  AND column_name = 'linked_customers';

-- 如果上面的查詢有結果，表示欄位已建立
-- 如果沒有結果，需要重新執行遷移腳本

-- 查看所有欄位
SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'customer_interactions'
ORDER BY ordinal_position;
