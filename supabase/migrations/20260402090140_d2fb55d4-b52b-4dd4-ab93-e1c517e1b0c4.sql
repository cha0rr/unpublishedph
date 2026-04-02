-- Make image-references bucket private
UPDATE storage.buckets SET public = false WHERE id = 'image-references';

-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Image references are publicly accessible" ON storage.objects;

-- Create a policy so authenticated users can read their own uploads
CREATE POLICY "Users can read own image references"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'image-references' AND (storage.foldername(name))[1] = auth.uid()::text);