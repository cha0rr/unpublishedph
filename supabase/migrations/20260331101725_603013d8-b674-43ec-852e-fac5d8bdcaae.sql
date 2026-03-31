-- Create public bucket for image references
INSERT INTO storage.buckets (id, name, public)
VALUES ('image-references', 'image-references', true);

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload image references"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'image-references' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Public read access
CREATE POLICY "Image references are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'image-references');

-- Users can delete their own uploads
CREATE POLICY "Users can delete their own image references"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'image-references' AND auth.uid()::text = (storage.foldername(name))[1]);