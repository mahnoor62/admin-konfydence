'use client';
export const dynamic = 'force-dynamic';
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  Divider,
  Snackbar,
  FormControlLabel,
  Switch,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const API_URL = `${API_BASE_URL}/api`;

function getApiInstance() {
  const instance = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });

  instance.interceptors.request.use((config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return instance;
}

// Helper function to create initial question structure
const createInitialQuestion = () => ({
  description: '', // This is the question itself
  answers: [
    { text: '', scoring: 0 },
    { text: '', scoring: 0 },
    { text: '', scoring: 0 },
    { text: '', scoring: 0 }
  ],
  feedback: '',
  attachments: []
});

// Helper function to create initial form data
const createInitialFormData = () => ({
  title: '',
  category: '',
  visibility: 'public',
  targetAudiences: [],
  isDemo: false,
  tags: [],
  question: createInitialQuestion() // Single question object
});

export default function Cards() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(createInitialFormData());
  const [uploading, setUploading] = useState({});
  const [viewingCard, setViewingCard] = useState(null); // Card being viewed in view mode
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [successMessage, setSuccessMessage] = useState(null);

  const formDataRef = useRef(formData);
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      setLoading(true);
      const api = getApiInstance();
      const response = await api.get('/cards');
      setCards(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching cards:', err);
      setError(err.response?.data?.error || 'Failed to load cards');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (card = null) => {
    if (card) {
      setEditing(card);
      // Convert card data to form structure - migrate from old structure if needed
      let question = null;
      
      // If card has new structure (single question object)
      if (card.question) {
        const questionDesc = card.question.description || card.question.questionText || '';
        question = {
          description: questionDesc,
          answers: card.question.answers && card.question.answers.length === 4
            ? card.question.answers
            : [
                { text: '', scoring: 0 },
                { text: '', scoring: 0 },
                { text: '', scoring: 0 },
                { text: '', scoring: 0 }
              ],
          feedback: card.question.feedback || '',
          attachments: card.question.attachments || []
        };
      } 
      // If card has old structure (questions array), take first one
      else if (card.questions && Array.isArray(card.questions) && card.questions.length > 0) {
        const q = card.questions[0];
        const questionDesc = q.description || q.questionText || '';
        question = {
          description: questionDesc,
          answers: q.answers && q.answers.length === 4
            ? q.answers
            : [
                { text: '', scoring: 0 },
                { text: '', scoring: 0 },
                { text: '', scoring: 0 },
                { text: '', scoring: 0 }
              ],
          feedback: q.feedback || '',
          attachments: q.attachments || []
        };
      }
      // If card has old structure (levels), migrate first question
      else if (card.levels && Array.isArray(card.levels)) {
        for (const level of card.levels) {
          if (level.questions && Array.isArray(level.questions) && level.questions.length > 0) {
            const q = level.questions[0];
            const questionDesc = q.description || q.questionText || '';
            question = {
              description: questionDesc,
              answers: q.answers && q.answers.length === 4
                ? q.answers
                : [
                    { text: '', scoring: 0 },
                    { text: '', scoring: 0 },
                    { text: '', scoring: 0 },
                    { text: '', scoring: 0 }
                  ],
              feedback: q.feedback || '',
              attachments: q.attachments || []
            };
            break;
          }
        }
      }
      
      // If no question found, create empty one
      if (!question) {
        question = createInitialQuestion();
      }
      
      setFormData({
        title: card.title || '',
        category: card.category || '',
        visibility: card.visibility || 'public',
        targetAudiences: card.targetAudiences || [],
        isDemo: card.isDemo || false,
        tags: card.tags || [],
        question: question
      });
    } else {
      setEditing(null);
      setFormData(createInitialFormData());
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditing(null);
    setFormData(createInitialFormData());
    setError(null);
  };

  const handleSubmit = async () => {
    if (!formData.title?.trim()) {
      setError('Card title is required');
      return;
    }

    try {
      const latestFormData = formDataRef.current;
      
      // Validate and prepare question
      const q = latestFormData.question || {};
      
      if (!q.description?.trim()) {
        setError('Question description is required');
        return;
      }
      
      // Ensure answers array has 4 items
      const answers = q.answers && q.answers.length === 4
        ? q.answers
        : [
            { text: q.answers?.[0]?.text || '', scoring: q.answers?.[0]?.scoring || 0 },
            { text: q.answers?.[1]?.text || '', scoring: q.answers?.[1]?.scoring || 0 },
            { text: q.answers?.[2]?.text || '', scoring: q.answers?.[2]?.scoring || 0 },
            { text: q.answers?.[3]?.text || '', scoring: q.answers?.[3]?.scoring || 0 }
          ];
      
      // Prepare question object with required fields
      const question = {
        description: q.description.trim(),
        answers: answers,
        feedback: q.feedback || '',
        attachments: q.attachments || []
      };
      
      const payload = {
        title: latestFormData.title.trim(),
        category: latestFormData.category || '',
        visibility: latestFormData.visibility || 'public',
        targetAudiences: latestFormData.targetAudiences || [],
        isDemo: latestFormData.isDemo || false,
        tags: latestFormData.tags || [],
        question: question
      };

      const api = getApiInstance();
      if (editing) {
        await api.put(`/cards/${editing._id}`, payload);
      } else {
        await api.post('/cards', payload);
      }
      fetchCards();
      handleClose();
      setError(null);
    } catch (err) {
      console.error('Error saving card:', err);
      
      // Extract and format concise error message
      let errorMessage = 'Failed to save card';
      
      if (err.response?.data) {
        const data = err.response.data;
        
        // Handle validation errors array (express-validator format)
        if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
          const firstError = data.errors[0];
          errorMessage = firstError.msg || firstError.message || 'Validation error';
        } 
        // Handle single error message
        else if (data.error) {
          errorMessage = data.error;
        } else if (data.message) {
          errorMessage = data.message;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    }
  };

  const handleDelete = async (id) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Card',
      message: 'Are you sure you want to delete this card? This action cannot be undone.',
      onConfirm: async () => {
        try {
          const api = getApiInstance();
          await api.delete(`/cards/${id}`);
          fetchCards();
          setConfirmDialog({ open: false, title: '', message: '', onConfirm: null });
          setSuccessMessage('Card deleted successfully!');
        } catch (err) {
          console.error('Error deleting card:', err);
          setError(err.response?.data?.error || 'Failed to delete card');
          setConfirmDialog({ open: false, title: '', message: '', onConfirm: null });
        }
      }
    });
  };

  const handleQuestionFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      question: {
        ...prev.question,
        [field]: value
      }
    }));
  };


  const handleAddTag = (tag) => {
    if (tag.trim() && !formData.tags.includes(tag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tag.trim()] });
    }
  };

  const handleRemoveTag = (tag) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const handleAnswerChange = (answerIndex, field, value) => {
    setFormData(prev => {
      const newAnswers = [...(prev.question?.answers || [])];
      newAnswers[answerIndex] = {
        ...newAnswers[answerIndex],
        [field]: value
      };
      return {
        ...prev,
        question: {
          ...prev.question,
          answers: newAnswers
        }
      };
    });
  };


  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadKey = 'question';
    try {
      setUploading(prev => ({ ...prev, [uploadKey]: true }));
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const api = getApiInstance();
      const uploadConfig = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };
      const uploadResponse = await api.post('/uploads', formDataUpload, uploadConfig);

      const newAttachment = {
        type: file.type.startsWith('audio/') ? 'audio' : 
               file.type.startsWith('video/') ? 'video' : 
               file.type === 'application/pdf' ? 'pdf' : 'word',
        title: file.name,
        url: uploadResponse.data.url
      };

      if (editing && editing._id) {
        try {
          await api.post(`/cards/${editing._id}/question/attachments`, {
            type: newAttachment.type,
            url: newAttachment.url,
            title: newAttachment.title
          });
          // Refresh card data
          const cardResponse = await api.get(`/cards/${editing._id}`);
          const updatedCard = cardResponse.data;
          handleOpen(updatedCard);
        } catch (err) {
          console.error('Error saving attachment:', err);
          setError(err.response?.data?.error || 'Failed to save attachment');
        }
      } else {
        handleQuestionFieldChange('attachments', [
          ...(formData.question?.attachments || []),
          newAttachment
        ]);
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      setError(err.response?.data?.error || 'Failed to upload file');
    } finally {
      setUploading(prev => ({ ...prev, [uploadKey]: false }));
    }
  };

  const handleUrlChange = async (url) => {
    if (!url || !url.trim()) return;

    let title = 'External Link';
    try {
      const urlObj = new URL(url.trim());
      title = urlObj.hostname.replace('www.', '') || 'External Link';
    } catch (e) {
      const parts = url.trim().split('/');
      title = parts[parts.length - 1] || parts[parts.length - 2] || 'External Link';
    }

    const newAttachment = {
      type: 'link',
      title: title,
      url: url.trim()
    };

    if (editing && editing._id) {
      try {
        setUploading(prev => ({ ...prev, 'question': true }));
        const api = getApiInstance();
        await api.post(`/cards/${editing._id}/question/attachments`, {
          type: newAttachment.type,
          url: newAttachment.url,
          title: newAttachment.title
        });
        const cardResponse = await api.get(`/cards/${editing._id}`);
        handleOpen(cardResponse.data);
      } catch (err) {
        console.error('Error saving attachment:', err);
        setError(err.response?.data?.error || 'Failed to save attachment');
      } finally {
        setUploading(prev => ({ ...prev, 'question': false }));
      }
    } else {
      handleQuestionFieldChange('attachments', [
        ...(formData.question?.attachments || []),
        newAttachment
      ]);
    }
  };

  const handleRemoveAttachment = async (attachmentIndex) => {
    const question = formData.question;
    const attachment = question?.attachments?.[attachmentIndex];
    if (!attachment) return;

    if (editing && editing._id && attachment._id) {
      try {
        const api = getApiInstance();
        await api.delete(`/cards/${editing._id}/question/attachments/${attachment._id}`);
        const cardResponse = await api.get(`/cards/${editing._id}`);
        handleOpen(cardResponse.data);
      } catch (err) {
        console.error('Error removing attachment:', err);
        setError(err.response?.data?.error || 'Failed to remove attachment');
      }
    } else {
      handleQuestionFieldChange('attachments', 
        (question?.attachments || []).filter((_, i) => i !== attachmentIndex)
      );
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Cards</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Create Card
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Visibility</TableCell>
              <TableCell>Last Updated</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cards.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography color="text.secondary">No cards found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              cards.map((card) => {
                return (
                  <TableRow key={card._id}>
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium">
                        {card.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {card.category || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={card.visibility || 'public'}
                        size="small"
                        color={card.visibility === 'public' ? 'success' : 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(card.updatedAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton 
                        size="small" 
                        onClick={() => setViewingCard(card)}
                        color="info"
                        title="View"
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleOpen(card)}
                        color="primary"
                        title="Edit"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleDelete(card._id)}
                        color="error"
                        title="Delete"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth scroll="paper">
        <DialogTitle>{editing ? 'Edit Card' : 'Create Card'}</DialogTitle>
        <DialogContent sx={{ maxHeight: '80vh', overflowY: 'auto' }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2, mt: 1 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Card Title *"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                helperText="Enter the title for this card/topic"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                helperText="Card category"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Visibility"
                value={formData.visibility}
                onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
              >
                <MenuItem value="public">Public</MenuItem>
                <MenuItem value="internal">Internal</MenuItem>
                <MenuItem value="custom_only">Custom Only</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                SelectProps={{ multiple: true }}
                label="Target Audiences"
                value={formData.targetAudiences || []}
                onChange={(e) => {
                  setFormData({ ...formData, targetAudiences: e.target.value });
                }}
                helperText="Select one or more target audiences"
              >
                <MenuItem value="B2C">B2C</MenuItem>
                <MenuItem value="B2B">B2B</MenuItem>
                <MenuItem value="B2E">B2E</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="body2" sx={{ mb: 1 }}>Tags</Typography>
              <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
                {formData.tags?.map((tag, idx) => (
                  <Chip
                    key={idx}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag)}
                    size="small"
                  />
                ))}
                <TextField
                  size="small"
                  placeholder="Add tag"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (e.target.value.trim()) {
                        handleAddTag(e.target.value);
                        e.target.value = '';
                      }
                    }
                  }}
                  sx={{ width: 150 }}
                />
                <Button 
                  size="small" 
                  variant="outlined"
                  onClick={(e) => {
                    const input = e.target.previousElementSibling?.querySelector('input');
                    if (input?.value?.trim()) {
                      handleAddTag(input.value);
                      input.value = '';
                    }
                  }}
                >
                  Add
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h5" sx={{ mb: 2 }}>Card Information</Typography>
              
              {/* Single question form - always visible, no accordion */}
              {formData.question && (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>Question</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Question *"
                      value={formData.question.description || ''}
                      onChange={(e) => handleQuestionFieldChange('description', e.target.value)}
                      multiline
                      rows={3}
                      required
                      placeholder="Enter your question here..."
                      helperText="This is the actual question text"
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Answers (4 Required)</Typography>
                    {(formData.question.answers || []).map((answer, answerIndex) => (
                      <Box key={answerIndex} sx={{ mb: 2, p: 1.5, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={8}>
                            <TextField
                              fullWidth
                              label={`Answer ${answerIndex + 1} *`}
                              value={answer.text || ''}
                              onChange={(e) => handleAnswerChange(answerIndex, 'text', e.target.value)}
                              required
                            />
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <TextField
                              fullWidth
                              label="Scoring *"
                              type="number"
                              value={answer.scoring || 0}
                              onChange={(e) => handleAnswerChange(answerIndex, 'scoring', parseFloat(e.target.value) || 0)}
                              inputProps={{ min: 0, step: 0.1 }}
                              required
                            />
                          </Grid>
                        </Grid>
                      </Box>
                    ))}
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Feedback/Explanation"
                      value={formData.question.feedback || ''}
                      onChange={(e) => handleQuestionFieldChange('feedback', e.target.value)}
                      multiline
                      rows={3}
                      placeholder="Short explanation for feedback..."
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Attachments</Typography>
                    {(formData.question.attachments || []).map((attachment, attIndex) => (
                      <Box key={attIndex} sx={{ mb: 1, p: 1, bgcolor: '#f5f5f5', borderRadius: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">{attachment.title}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {attachment.type.toUpperCase()}
                          </Typography>
                        </Box>
                        <IconButton size="small" onClick={() => handleRemoveAttachment(attIndex)}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                    <Box sx={{ mt: 1, p: 1.5, border: '1px dashed #ccc', borderRadius: 1 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Button
                            variant="outlined"
                            component="label"
                            startIcon={<AttachFileIcon />}
                            fullWidth
                            disabled={uploading['question']}
                          >
                            {uploading['question'] ? 'Uploading...' : 'Upload File'}
                            <input
                              type="file"
                              hidden
                              accept="audio/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                              onChange={handleFileChange}
                            />
                          </Button>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="External Link URL"
                            placeholder="https://example.com"
                            onBlur={(e) => {
                              if (e.target.value.trim()) {
                                handleUrlChange(e.target.value);
                                e.target.value = '';
                              }
                            }}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && e.target.value.trim()) {
                                handleUrlChange(e.target.value);
                                e.target.value = '';
                              }
                            }}
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  </Grid>
                </Grid>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Card Dialog */}
      <Dialog open={!!viewingCard} onClose={() => setViewingCard(null)} maxWidth="lg" fullWidth scroll="paper">
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">View Card: {viewingCard?.title}</Typography>
            <IconButton onClick={() => setViewingCard(null)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ maxHeight: '80vh', overflowY: 'auto' }}>
          {viewingCard && (
            <Box>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Card Information</Typography>
                  <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1, mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Title:</Typography>
                    <Typography variant="body1" fontWeight="medium">{viewingCard.title}</Typography>
                    {viewingCard.category && (
                      <>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Category:</Typography>
                        <Typography variant="body2">{viewingCard.category}</Typography>
                      </>
                    )}
                    {viewingCard.visibility && (
                      <>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Visibility:</Typography>
                        <Typography variant="body2">{viewingCard.visibility}</Typography>
                      </>
                    )}
                    {viewingCard.targetAudiences && viewingCard.targetAudiences.length > 0 && (
                      <>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Target Audiences:</Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                          {viewingCard.targetAudiences.map((aud, idx) => (
                            <Chip key={idx} label={aud} size="small" />
                          ))}
                        </Box>
                      </>
                    )}
                    {viewingCard.tags && viewingCard.tags.length > 0 && (
                      <>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Tags:</Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                          {viewingCard.tags.map((tag, idx) => (
                            <Chip key={idx} label={tag} size="small" variant="outlined" />
                          ))}
                        </Box>
                      </>
                    )}
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Created:</Typography>
                    <Typography variant="body2">{new Date(viewingCard.createdAt).toLocaleString()}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Last Updated:</Typography>
                    <Typography variant="body2">{new Date(viewingCard.updatedAt).toLocaleString()}</Typography>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                    Card
                  </Typography>
                  
                  {/* Support both old (questions array/levels) and new (single question) structure */}
                  {(() => {
                    let questionToShow = null;
                    
                    // New structure (single question object)
                    if (viewingCard.question) {
                      questionToShow = viewingCard.question;
                    }
                    // Old structure (questions array) - take first one
                    else if (viewingCard.questions && Array.isArray(viewingCard.questions) && viewingCard.questions.length > 0) {
                      questionToShow = viewingCard.questions[0];
                    }
                    // Old structure (levels) - migrate first question
                    else if (viewingCard.levels && Array.isArray(viewingCard.levels)) {
                      for (const level of viewingCard.levels) {
                        if (level.questions && Array.isArray(level.questions) && level.questions.length > 0) {
                          questionToShow = level.questions[0];
                          break;
                        }
                      }
                    }
                    
                    if (!questionToShow || (!questionToShow.description?.trim() && !questionToShow.questionText?.trim())) {
                      return <Typography variant="body2" color="text.secondary">No question available</Typography>;
                    }
                    
                    const question = questionToShow;
                    const questionDesc = question.description || question.questionText || '';
                    
                    return (
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" color="text.secondary">Question:</Typography>
                          <Typography variant="body1" sx={{ mt: 0.5 }}>{questionDesc}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Answers:</Typography>
                          {question.answers?.map((answer, ansIdx) => (
                            <Box key={ansIdx} sx={{ mb: 1, p: 1, bgcolor: '#f9f9f9', borderRadius: 1 }}>
                              <Typography variant="body2">
                                <strong>Answer {ansIdx + 1}:</strong> {answer.text} 
                                <Chip label={`Score: ${answer.scoring}`} size="small" sx={{ ml: 1 }} />
                              </Typography>
                            </Box>
                          ))}
                        </Grid>
                        {question.feedback && (
                          <Grid item xs={12}>
                            <Typography variant="subtitle2" color="text.secondary">Feedback:</Typography>
                            <Typography variant="body2" sx={{ mt: 0.5 }}>{question.feedback}</Typography>
                          </Grid>
                        )}
                        {question.attachments && question.attachments.length > 0 && (
                          <Grid item xs={12}>
                            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Attachments:</Typography>
                            {question.attachments.map((att, attIdx) => (
                              <Box key={attIdx} sx={{ mb: 1, p: 1, bgcolor: '#f9f9f9', borderRadius: 1, display: 'flex', justifyContent: 'space-between' }}>
                                <Box>
                                  <Typography variant="body2" fontWeight="bold">{att.title}</Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {att.type.toUpperCase()}
                                  </Typography>
                                </Box>
                                <Button size="small" href={att.url} target="_blank" rel="noopener noreferrer">
                                  View
                                </Button>
                              </Box>
                            ))}
                          </Grid>
                        )}
                      </Grid>
                    );
                  })()}
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => viewingCard && handleOpen(viewingCard)} variant="contained" startIcon={<EditIcon />}>
            Edit Card
          </Button>
          <Button onClick={() => setViewingCard(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog 
        open={confirmDialog.open} 
        onClose={() => setConfirmDialog({ open: false, title: '', message: '', onConfirm: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <Typography>{confirmDialog.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setConfirmDialog({ open: false, title: '', message: '', onConfirm: null })}
            color="inherit"
          >
            Cancel
          </Button>
          <Button 
            onClick={() => {
              if (confirmDialog.onConfirm) {
                confirmDialog.onConfirm();
              }
            }}
            variant="contained"
            color="error"
            autoFocus
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setSuccessMessage(null)} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
