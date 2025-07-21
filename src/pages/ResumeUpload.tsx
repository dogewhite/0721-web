import React, { useState } from 'react';
import { uploadResumeWithKimi } from '../api/draftResume';

const ResumeUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await uploadResumeWithKimi(file);
      setResult(res.data);
    } catch (err: any) {
      setResult({ success: false, message: err?.response?.data?.detail || '上传失败' });
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: 32 }}>
      <h2>上传简历（Kimi标准化）</h2>
      <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.json" onChange={handleFileChange} />
      <div style={{ color: '#888', fontSize: 14, margin: '8px 0 16px 0' }}>
        支持 PDF、Word、Excel、TXT、JSON 等主流格式简历文件（最多10个文件）
      </div>
      <button onClick={handleUpload} disabled={!file || loading} style={{ marginLeft: 0 }}>
        {loading ? '上传中...' : '上传并标准化'}
      </button>
      {result && (
        <div style={{ marginTop: 24 }}>
          {result.success ? (
            <div>
              <b>上传成功！</b>
              <div>请前往 <a href="/resume/draft">草稿区</a> 审核并确认入库。</div>
            </div>
          ) : (
            <div style={{ color: 'red' }}>{result.message}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResumeUpload; 