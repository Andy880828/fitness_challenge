-- 移除過時的 photos 刪除同步 trigger。
-- 原因：Supabase 已禁止任何 SQL 對 storage.objects 做 DELETE
--       (error 42501 "Direct deletion from storage tables is not allowed")。
--       應用層 (server/api/{admin/,}photos/[id].delete.ts) 已負責先呼叫
--       Storage API 移除物件，再 DELETE FROM photos，trigger 已是純多餘。

drop trigger if exists delete_photo_storage on public.photos;
drop function if exists public.delete_photo_storage();
