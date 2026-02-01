-- Migration 015: Storage Policies für business-images Bucket
-- Erlaubt Upload und Lesen von Bildern

-- Policy: Jeder kann Bilder lesen (öffentlicher Bucket)
DROP POLICY IF EXISTS "Public can read business images" ON storage.objects;
CREATE POLICY "Public can read business images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'business-images');

-- Policy: Service Role kann Bilder hochladen
DROP POLICY IF EXISTS "Service role can upload business images" ON storage.objects;
CREATE POLICY "Service role can upload business images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'business-images');

-- Policy: Service Role kann Bilder aktualisieren
DROP POLICY IF EXISTS "Service role can update business images" ON storage.objects;
CREATE POLICY "Service role can update business images"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'business-images');

-- Policy: Service Role kann Bilder löschen
DROP POLICY IF EXISTS "Service role can delete business images" ON storage.objects;
CREATE POLICY "Service role can delete business images"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'business-images');
