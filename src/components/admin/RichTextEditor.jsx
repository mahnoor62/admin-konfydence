import { useRef } from 'react';
import { Box, Typography } from '@mui/material';
import dynamic from 'next/dynamic';

// Dynamically import react-quill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { 
  ssr: false,
  loading: () => <Box sx={{ minHeight: '200px', p: 2 }}>Loading editor...</Box>
});

const RichTextEditor = ({ value, onChange, placeholder = 'Enter content...', label }) => {
  const quillRef = useRef(null);

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'font': [] }],
      [{ 'size': [] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link', 'image', 'video'],
      ['clean']
    ],
    clipboard: {
      matchVisual: false,
    }
  };

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'color', 'background',
    'align',
    'link', 'image', 'video'
  ];

  return (
    <Box
      sx={{
        '& .ql-container': {
          minHeight: '200px',
          fontSize: '1rem',
        },
        '& .ql-editor': {
          minHeight: '200px',
        },
        '& .ql-toolbar': {
          borderTop: '1px solid #e0e0e0',
          borderLeft: '1px solid #e0e0e0',
          borderRight: '1px solid #e0e0e0',
          borderBottom: 'none',
          borderRadius: '4px 4px 0 0',
        },
        '& .ql-container': {
          borderBottom: '1px solid #e0e0e0',
          borderLeft: '1px solid #e0e0e0',
          borderRight: '1px solid #e0e0e0',
          borderTop: 'none',
          borderRadius: '0 0 4px 4px',
        },
      }}
    >
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value || ''}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
    </Box>
  );
};

export default RichTextEditor;

