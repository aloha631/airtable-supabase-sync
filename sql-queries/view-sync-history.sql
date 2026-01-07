-- ================================================
-- 查看同步歷史記錄
-- ================================================

-- 查看最近 10 次同步記錄
SELECT
  id,
  sync_time,
  status,
  records_checked,
  records_inserted,
  records_updated,
  records_failed,
  error_message
FROM sync_history
ORDER BY sync_time DESC
LIMIT 10;

-- 查看成功的同步記錄
-- SELECT * FROM sync_history WHERE status = 'success' ORDER BY sync_time DESC;

-- 查看失敗的同步記錄
-- SELECT * FROM sync_history WHERE status = 'failed' ORDER BY sync_time DESC;

-- 統計同步狀態
-- SELECT
--   status,
--   COUNT(*) as count,
--   AVG(records_checked) as avg_checked,
--   AVG(records_updated) as avg_updated
-- FROM sync_history
-- GROUP BY status;

-- 查看最近 24 小時的同步記錄
-- SELECT * FROM sync_history
-- WHERE sync_time > NOW() - INTERVAL '24 hours'
-- ORDER BY sync_time DESC;
