import { useState } from 'react';
import { downloadFile, saveBlob } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';

// Downloads the (demo) installer or code file of one library item, with a progress bar
export default function DownloadButton({ item, onDone, small = false }) {
  const toast = useToast();
  const [progress, setProgress] = useState(null);

  const start = async () => {
    setProgress(0);
    // the demo file is tiny, so we also fill the bar over ~1 second
    let fake = 0;
    const timer = setInterval(() => {
      fake = Math.min(0.9, fake + 0.1);
      setProgress((p) => Math.max(p ?? 0, fake));
    }, 100);
    try {
      const { blob, fileName } = await downloadFile(`/library/${item.entryId}/download`);
      await new Promise((r) => setTimeout(r, 900));
      setProgress(1);
      saveBlob(blob, fileName);
      toast.success(`${fileName} was downloaded.`);
      onDone?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      clearInterval(timer);
      setTimeout(() => setProgress(null), 300);
    }
  };

  if (progress !== null) {
    return (
      <div className="progress">
        <div className="progress-bar" style={{ width: `${Math.round(progress * 100)}%` }} />
        <span>{Math.round(progress * 100)}%</span>
      </div>
    );
  }
  return (
    <button type="button" className={`btn btn-primary ${small ? 'btn-sm' : ''}`} onClick={start}>
      {item.type === 'epin' ? 'Download code' : 'Download'}
    </button>
  );
}
