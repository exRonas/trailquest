import { useRef, useState } from 'react';
import { uploadImageFile } from '../api/images';
import { apiErrorMessage } from '../api/client';

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
}

/** URL text field + a compress-and-upload button, sharing one string value so
 *  pasting an external URL still works alongside picking a local file. */
export function ImageUploadField({ label, value, onChange }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onPick = () => inputRef.current?.click();

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-picking the same file later
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadImageFile(file);
      onChange(url);
    } catch (err) {
      setError(apiErrorMessage(err, 'Upload failed'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="field">
      <label>{label}</label>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://… or upload a file"
          style={{ flex: 1 }}
        />
        <button
          type="button"
          className="secondary"
          onClick={onPick}
          disabled={uploading}
        >
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
        {value ? (
          <button type="button" className="ghost" onClick={() => onChange('')}>
            Clear
          </button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={onFileSelected}
      />
      {error ? <div className="error">{error}</div> : null}
      {value ? (
        <img
          src={value}
          alt=""
          style={{ maxWidth: 160, maxHeight: 100, marginTop: 6, borderRadius: 6, display: 'block' }}
        />
      ) : null}
    </div>
  );
}
