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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
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
  title: '',
  description: '', // This is the question itself
  category: '',
  tags: [],
  targetAudiences: [],
  visibility: 'public',
  answers: [
    { text: '', scoring: 0 },
    { text: '', scoring: 0 },
    { text: '', scoring: 0 },
    { text: '', scoring: 0 }
  ],
  feedback: '',
  attachments: []
});

// Helper function to create initial level structure with 30 questions
const createInitialLevel = (levelNumber) => ({
  levelNumber: levelNumber,
  questions: Array.from({ length: 30 }, () => createInitialQuestion())
});

// Helper function to create initial form data with 3 levels
const createInitialFormData = () => ({
  title: '',
  levels: [
    createInitialLevel(1),
    createInitialLevel(2),
    createInitialLevel(3)
  ]
});

export default function Cards() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(createInitialFormData());
  const [uploading, setUploading] = useState({});
  const [expandedLevel, setExpandedLevel] = useState([]); // No levels expanded by default to improve performance
  const [expandedQuestion, setExpandedQuestion] = useState({});
  const [expandedCardRows, setExpandedCardRows] = useState({}); // Track which card rows are expanded
  const [viewingCard, setViewingCard] = useState(null); // Card being viewed in view mode
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });

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
      // Convert card data to form structure - preserve existing levels and questions
      const cardLevels = card.levels || [];
      const levels = cardLevels.map((level) => {
        const questions = (level.questions || []).map(q => {
          // Migrate questionText to description if needed
          const questionDesc = q.description || q.questionText || '';
          return {
            title: q.title || '',
            description: questionDesc,
            category: q.category || '',
            tags: q.tags || [],
            targetAudiences: q.targetAudiences || [],
            visibility: q.visibility || 'public',
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
        });
        
        return {
          levelNumber: level.levelNumber || 1,
          questions: questions
        };
      });
      setFormData({
        title: card.title || '',
        levels: levels
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
    setExpandedLevel([]);
    setExpandedQuestion({});
    setError(null);
  };

  const handleSubmit = async () => {
    if (!formData.title?.trim()) {
      setError('Card title is required');
      return;
    }

    try {
      const latestFormData = formDataRef.current;
      
      // Filter out empty questions - only include questions that have both title AND description
      // If a question has partial data, we'll save it but it won't be "complete"
      const cleanedLevels = latestFormData.levels.map(level => {
        const validQuestions = level.questions
          .filter(q => {
            // Only include questions that have BOTH title AND description (complete questions)
            // Empty questions are filtered out
            return q.title?.trim() && q.description?.trim();
          })
          .map(q => {
            // Ensure answers array has 4 items
            const answers = q.answers && q.answers.length === 4
              ? q.answers
              : [
                  { text: q.answers?.[0]?.text || '', scoring: q.answers?.[0]?.scoring || 0 },
                  { text: q.answers?.[1]?.text || '', scoring: q.answers?.[1]?.scoring || 0 },
                  { text: q.answers?.[2]?.text || '', scoring: q.answers?.[2]?.scoring || 0 },
                  { text: q.answers?.[3]?.text || '', scoring: q.answers?.[3]?.scoring || 0 }
                ];
            
            return {
              ...q,
              answers: answers
            };
          });
        
        // Only include levels that have at least one valid question, or keep empty levels
        return {
          ...level,
          questions: validQuestions
        };
      }).filter(level => level.questions.length > 0); // Remove levels with no questions
      
      const payload = {
        title: latestFormData.title.trim(),
        levels: cleanedLevels // Can be empty array - that's fine!
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
        } catch (err) {
          console.error('Error deleting card:', err);
          setError(err.response?.data?.error || 'Failed to delete card');
          setConfirmDialog({ open: false, title: '', message: '', onConfirm: null });
        }
      }
    });
  };

  const handleQuestionFieldChange = (levelIndex, questionIndex, field, value) => {
    setFormData(prev => {
      const newLevels = [...prev.levels];
      const newQuestions = [...newLevels[levelIndex].questions];
      newQuestions[questionIndex] = {
        ...newQuestions[questionIndex],
        [field]: value
      };
      newLevels[levelIndex] = {
        ...newLevels[levelIndex],
        questions: newQuestions
      };
      return {
        ...prev,
        levels: newLevels
      };
    });
  };

  const handleAddQuestionTag = (levelIndex, questionIndex, tag) => {
    const question = formData.levels[levelIndex].questions[questionIndex];
    if (tag.trim() && !question.tags.includes(tag.trim())) {
      handleQuestionFieldChange(levelIndex, questionIndex, 'tags', [...question.tags, tag.trim()]);
    }
  };

  const handleRemoveQuestionTag = (levelIndex, questionIndex, tag) => {
    const question = formData.levels[levelIndex].questions[questionIndex];
    handleQuestionFieldChange(levelIndex, questionIndex, 'tags', question.tags.filter(t => t !== tag));
  };

  const handleDeleteLevel = (levelIndex) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Level',
      message: 'Are you sure you want to delete this level? All questions in this level will be removed. This action cannot be undone.',
      onConfirm: () => {
        setFormData(prev => ({
          ...prev,
          levels: prev.levels.filter((_, idx) => idx !== levelIndex).map((level, idx) => ({
            ...level,
            levelNumber: idx + 1
          }))
        }));
        setExpandedLevel(prev => prev.filter(idx => idx !== levelIndex).map(idx => idx > levelIndex ? idx - 1 : idx));
        setConfirmDialog({ open: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  const handleDeleteQuestion = (levelIndex, questionIndex) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Question',
      message: 'Are you sure you want to delete this question? This action cannot be undone.',
      onConfirm: () => {
        setFormData(prev => {
          const newLevels = [...prev.levels];
          const newQuestions = newLevels[levelIndex].questions.filter((_, idx) => idx !== questionIndex);
          newLevels[levelIndex] = {
            ...newLevels[levelIndex],
            questions: newQuestions
          };
          return {
            ...prev,
            levels: newLevels
          };
        });
        // Remove from expanded questions
        const key = `${levelIndex}-${questionIndex}`;
        setExpandedQuestion(prev => {
          const newExpanded = {};
          Object.keys(prev).forEach(k => {
            if (k !== key) {
              const [lIdx, qIdx] = k.split('-').map(Number);
              if (lIdx === levelIndex && qIdx > questionIndex) {
                newExpanded[`${lIdx}-${qIdx - 1}`] = prev[k];
              } else if (lIdx !== levelIndex) {
                newExpanded[k] = prev[k];
              }
            }
          });
          return newExpanded;
        });
        setConfirmDialog({ open: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  const handleQuestionChange = (levelIndex, questionIndex, field, value) => {
    setFormData(prev => {
      const newLevels = [...prev.levels];
      const newQuestions = [...newLevels[levelIndex].questions];
      newQuestions[questionIndex] = {
        ...newQuestions[questionIndex],
        [field]: value
      };
      newLevels[levelIndex] = {
        ...newLevels[levelIndex],
        questions: newQuestions
      };
      return {
        ...prev,
        levels: newLevels
      };
    });
  };

  const handleAnswerChange = (levelIndex, questionIndex, answerIndex, field, value) => {
    setFormData(prev => {
      const newLevels = [...prev.levels];
      const newQuestions = [...newLevels[levelIndex].questions];
      const newAnswers = [...newQuestions[questionIndex].answers];
      newAnswers[answerIndex] = {
        ...newAnswers[answerIndex],
        [field]: value
      };
      newQuestions[questionIndex] = {
        ...newQuestions[questionIndex],
        answers: newAnswers
      };
      newLevels[levelIndex] = {
        ...newLevels[levelIndex],
        questions: newQuestions
      };
      return {
        ...prev,
        levels: newLevels
      };
    });
  };

  const handleLevelToggle = (levelIndex) => {
    setExpandedLevel(prev => 
      prev.includes(levelIndex) 
        ? prev.filter(i => i !== levelIndex)
        : [...prev, levelIndex]
    );
  };

  const handleQuestionToggle = (levelIndex, questionIndex) => {
    const key = `${levelIndex}-${questionIndex}`;
    setExpandedQuestion(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleFileChange = async (levelIndex, questionIndex, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadKey = `${levelIndex}-${questionIndex}`;
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
          await api.post(`/cards/${editing._id}/levels/${levelIndex}/questions/${questionIndex}/attachments`, {
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
        handleQuestionChange(levelIndex, questionIndex, 'attachments', [
          ...formData.levels[levelIndex].questions[questionIndex].attachments,
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

  const handleUrlChange = async (levelIndex, questionIndex, url) => {
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
        setUploading(prev => ({ ...prev, [`${levelIndex}-${questionIndex}`]: true }));
        const api = getApiInstance();
        await api.post(`/cards/${editing._id}/levels/${levelIndex}/questions/${questionIndex}/attachments`, {
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
        setUploading(prev => ({ ...prev, [`${levelIndex}-${questionIndex}`]: false }));
      }
    } else {
      handleQuestionChange(levelIndex, questionIndex, 'attachments', [
        ...formData.levels[levelIndex].questions[questionIndex].attachments,
        newAttachment
      ]);
    }
  };

  const handleRemoveAttachment = async (levelIndex, questionIndex, attachmentIndex) => {
    const question = formData.levels[levelIndex].questions[questionIndex];
    const attachment = question.attachments[attachmentIndex];
    if (!attachment) return;

    if (editing && editing._id && attachment._id) {
      try {
        const api = getApiInstance();
        await api.delete(`/cards/${editing._id}/levels/${levelIndex}/questions/${questionIndex}/attachments/${attachment._id}`);
        const cardResponse = await api.get(`/cards/${editing._id}`);
        handleOpen(cardResponse.data);
      } catch (err) {
        console.error('Error removing attachment:', err);
        setError(err.response?.data?.error || 'Failed to remove attachment');
      }
    } else {
      handleQuestionChange(levelIndex, questionIndex, 'attachments', 
        question.attachments.filter((_, i) => i !== attachmentIndex)
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
              <TableCell width="50px"></TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Levels</TableCell>
              <TableCell>Total Questions</TableCell>
              <TableCell>Last Updated</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cards.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="text.secondary">No cards found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              cards.map((card) => {
                const isExpanded = expandedCardRows[card._id] || false;
                const totalLevels = card.levels?.length || 0;
                const totalQuestions = card.levels?.reduce((sum, level) => sum + (level.questions?.length || 0), 0) || 0;
                const filledQuestions = card.levels?.reduce((sum, level) => 
                  sum + (level.questions?.filter(q => q.description?.trim()).length || 0), 0) || 0;
                
                return (
                  <React.Fragment key={card._id}>
                    <TableRow>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => setExpandedCardRows(prev => ({
                            ...prev,
                            [card._id]: !prev[card._id]
                          }))}
                        >
                          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" fontWeight="medium">
                          {card.title}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={`${totalLevels} Levels`} 
                          color="primary" 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {filledQuestions} / {totalQuestions} Questions
                        </Typography>
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
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={6} sx={{ py: 2, backgroundColor: '#f5f5f5' }}>
                          <Box>
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                              Card Details
                            </Typography>
                            <Grid container spacing={2}>
                              <Grid item xs={12} sm={6}>
                                <Typography variant="body2" color="text.secondary">Title:</Typography>
                                <Typography variant="body1">{card.title}</Typography>
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <Typography variant="body2" color="text.secondary">Created:</Typography>
                                <Typography variant="body1">
                                  {new Date(card.createdAt).toLocaleDateString()}
                                </Typography>
                              </Grid>
                              <Grid item xs={12}>
                                <Divider sx={{ my: 1 }} />
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                                  Levels Breakdown:
                                </Typography>
                                {card.levels?.map((level, idx) => {
                                  const levelQuestions = level.questions?.length || 0;
                                  const filledLevelQuestions = level.questions?.filter(q => q.description?.trim()).length || 0;
                                  return (
                                    <Box key={idx} sx={{ mb: 1, p: 1, bgcolor: 'white', borderRadius: 1 }}>
                                      <Typography variant="body2">
                                        <strong>Level {level.levelNumber}:</strong> {filledLevelQuestions} / {levelQuestions} questions
                                      </Typography>
                                    </Box>
                                  );
                                })}
                              </Grid>
                            </Grid>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
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

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h5">Levels</Typography>
                <Box display="flex" gap={1} alignItems="center">
                  <Chip label={`${formData.levels.length} Levels`} color="primary" />
                  {formData.levels.length < 3 && (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        const newLevelNumber = formData.levels.length + 1;
                        setFormData(prev => ({
                          ...prev,
                          levels: [...prev.levels, createInitialLevel(newLevelNumber)]
                        }));
                        setExpandedLevel(prev => [...prev, formData.levels.length]);
                      }}
                    >
                      Add Level
                    </Button>
                  )}
                </Box>
              </Box>
              
              {formData.levels.map((level, levelIndex) => (
                <Accordion
                  key={levelIndex}
                  expanded={expandedLevel.includes(levelIndex)}
                  onChange={() => handleLevelToggle(levelIndex)}
                  sx={{ mb: 2 }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ width: '100%', mr: 2 }}>
                      <Typography variant="h6">Level {level.levelNumber} - {level.questions.filter(q => q.description?.trim()).length} Questions</Typography>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteLevel(levelIndex);
                        }}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => {
                          setFormData(prev => {
                            const newLevels = [...prev.levels];
                            const newQuestions = [...newLevels[levelIndex].questions, createInitialQuestion()];
                            newLevels[levelIndex] = {
                              ...newLevels[levelIndex],
                              questions: newQuestions
                            };
                            return {
                              ...prev,
                              levels: newLevels
                            };
                          });
                          // Auto-expand the new question
                          const newQuestionIndex = level.questions.length;
                          setExpandedQuestion(prev => ({
                            ...prev,
                            [`${levelIndex}-${newQuestionIndex}`]: true
                          }));
                        }}
                      >
                        Add Question
                      </Button>
                    </Box>
                    {expandedLevel.includes(levelIndex) ? (
                      level.questions.map((question, questionIndex) => {
                        const isQuestionExpanded = expandedQuestion[`${levelIndex}-${questionIndex}`] || false;
                        return (
                          <Accordion
                            key={questionIndex}
                            expanded={isQuestionExpanded}
                            onChange={() => handleQuestionToggle(levelIndex, questionIndex)}
                            sx={{ mb: 1 }}
                          >
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                              <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ width: '100%', mr: 2 }}>
                                <Typography>
                                  Question {questionIndex + 1}: {question.title || question.description || 'New Question'}
                                </Typography>
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteQuestion(levelIndex, questionIndex);
                                  }}
                                  color="error"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </AccordionSummary>
                            {isQuestionExpanded && (
                              <AccordionDetails>
                                <Grid container spacing={2}>
                                  <Grid item xs={12}>
                                    <Divider sx={{ mb: 2 }} />
                                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>Question Information</Typography>
                                  </Grid>
                                  <Grid item xs={12}>
                                    <TextField
                                      fullWidth
                                      label="Title *"
                                      value={question.title}
                                      onChange={(e) => handleQuestionFieldChange(levelIndex, questionIndex, 'title', e.target.value)}
                                      required
                                    />
                                  </Grid>
                                  <Grid item xs={12} sm={6}>
                                    <TextField
                                      fullWidth
                                      label="Category"
                                      value={question.category}
                                      onChange={(e) => handleQuestionFieldChange(levelIndex, questionIndex, 'category', e.target.value)}
                                    />
                                  </Grid>
                                  <Grid item xs={12} sm={6}>
                                    <TextField
                                      fullWidth
                                      select
                                      label="Visibility"
                                      value={question.visibility}
                                      onChange={(e) => handleQuestionFieldChange(levelIndex, questionIndex, 'visibility', e.target.value)}
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
                                      value={question.targetAudiences || []}
                                      onChange={(e) => handleQuestionFieldChange(levelIndex, questionIndex, 'targetAudiences', e.target.value)}
                                    >
                                      <MenuItem value="B2C">B2C</MenuItem>
                                      <MenuItem value="B2B">B2B</MenuItem>
                                      <MenuItem value="B2E">B2E</MenuItem>
                                    </TextField>
                                  </Grid>
                                  <Grid item xs={12}>
                                    <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
                                      {question.tags?.map((tag, idx) => (
                                        <Chip
                                          key={idx}
                                          label={tag}
                                          onDelete={() => handleRemoveQuestionTag(levelIndex, questionIndex, tag)}
                                          size="small"
                                        />
                                      ))}
                                      <TextField
                                        size="small"
                                        placeholder="Add tag"
                                        inputRef={(input) => {
                                          if (input) {
                                            input._questionTagInput = { levelIndex, questionIndex };
                                          }
                                        }}
                                        onKeyPress={(e) => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault();
                                            if (e.target.value.trim()) {
                                              handleAddQuestionTag(levelIndex, questionIndex, e.target.value);
                                              e.target.value = '';
                                            }
                                          }
                                        }}
                                        sx={{ width: 150 }}
                                      />
                                      <Button size="small" onClick={(e) => {
                                        const input = e.target.previousElementSibling?.querySelector('input');
                                        if (input?.value?.trim()) {
                                          handleAddQuestionTag(levelIndex, questionIndex, input.value);
                                          input.value = '';
                                        }
                                      }}>Add</Button>
                                    </Box>
                                  </Grid>
                                  <Grid item xs={12}>
                                    <Divider sx={{ my: 2 }} />
                                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>Question</Typography>
                                  </Grid>
                                  <Grid item xs={12}>
                                    <TextField
                                      fullWidth
                                      label="Question *"
                                      value={question.description}
                                      onChange={(e) => handleQuestionFieldChange(levelIndex, questionIndex, 'description', e.target.value)}
                                      multiline
                                      rows={3}
                                      required
                                      placeholder="Enter your question here..."
                                      helperText="This is the actual question text"
                                    />
                                  </Grid>
                                  
                                  <Grid item xs={12}>
                                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Answers (4 Required)</Typography>
                                    {question.answers.map((answer, answerIndex) => (
                                      <Box key={answerIndex} sx={{ mb: 2, p: 1.5, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                                        <Grid container spacing={2}>
                                          <Grid item xs={12} sm={8}>
                                            <TextField
                                              fullWidth
                                              label={`Answer ${answerIndex + 1} *`}
                                              value={answer.text}
                                              onChange={(e) => handleAnswerChange(levelIndex, questionIndex, answerIndex, 'text', e.target.value)}
                                              required
                                            />
                                          </Grid>
                                          <Grid item xs={12} sm={4}>
                                            <TextField
                                              fullWidth
                                              label="Scoring *"
                                              type="number"
                                              value={answer.scoring}
                                              onChange={(e) => handleAnswerChange(levelIndex, questionIndex, answerIndex, 'scoring', parseFloat(e.target.value) || 0)}
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
                                      value={question.feedback}
                                      onChange={(e) => handleQuestionChange(levelIndex, questionIndex, 'feedback', e.target.value)}
                                      multiline
                                      rows={3}
                                      placeholder="Short explanation for feedback..."
                                    />
                                  </Grid>

                                  <Grid item xs={12}>
                                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Attachments</Typography>
                                    {question.attachments.map((attachment, attIndex) => (
                                      <Box key={attIndex} sx={{ mb: 1, p: 1, bgcolor: '#f5f5f5', borderRadius: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box>
                                          <Typography variant="body2" fontWeight="bold">{attachment.title}</Typography>
                                          <Typography variant="caption" color="text.secondary">
                                            {attachment.type.toUpperCase()}
                                          </Typography>
                                        </Box>
                                        <IconButton size="small" onClick={() => handleRemoveAttachment(levelIndex, questionIndex, attIndex)}>
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
                                            disabled={uploading[`${levelIndex}-${questionIndex}`]}
                                          >
                                            {uploading[`${levelIndex}-${questionIndex}`] ? 'Uploading...' : 'Upload File'}
                                            <input
                                              type="file"
                                              hidden
                                              accept="audio/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                              onChange={(e) => handleFileChange(levelIndex, questionIndex, e)}
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
                                                handleUrlChange(levelIndex, questionIndex, e.target.value);
                                                e.target.value = '';
                                              }
                                            }}
                                            onKeyPress={(e) => {
                                              if (e.key === 'Enter' && e.target.value.trim()) {
                                                handleUrlChange(levelIndex, questionIndex, e.target.value);
                                                e.target.value = '';
                                              }
                                            }}
                                          />
                                        </Grid>
                                      </Grid>
                                    </Box>
                                  </Grid>
                                </Grid>
                              </AccordionDetails>
                            )}
                          </Accordion>
                        );
                      })
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                        Click to expand and view 30 questions for this level
                      </Typography>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))}
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
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Created:</Typography>
                    <Typography variant="body2">{new Date(viewingCard.createdAt).toLocaleString()}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Last Updated:</Typography>
                    <Typography variant="body2">{new Date(viewingCard.updatedAt).toLocaleString()}</Typography>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Levels ({viewingCard.levels?.length || 0})
                  </Typography>
                  
                  {viewingCard.levels?.map((level, levelIndex) => {
                    const levelQuestions = level.questions || [];
                    const filledQuestions = levelQuestions.filter(q => q.description?.trim()).length;
                    return (
                      <Accordion key={levelIndex} sx={{ mb: 2 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography variant="subtitle1" fontWeight="medium">
                            Level {level.levelNumber} - {filledQuestions} / {levelQuestions.length} Questions
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          {levelQuestions.map((question, questionIndex) => {
                            if (!question.description?.trim() && !question.questionText?.trim()) return null;
                            const questionDesc = question.description || question.questionText || '';
                            return (
                              <Accordion key={questionIndex} sx={{ mb: 1 }}>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                  <Typography>
                                    Question {questionIndex + 1}: {question.title || questionDesc || 'Untitled'}
                                  </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                  <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                      <Typography variant="subtitle2" color="text.secondary">Question Information:</Typography>
                                      <Box sx={{ mt: 1, p: 1.5, bgcolor: '#f9f9f9', borderRadius: 1 }}>
                                        {question.title && (
                                          <Typography variant="body2"><strong>Title:</strong> {question.title}</Typography>
                                        )}
                                        {question.category && (
                                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                                            <strong>Category:</strong> {question.category}
                                          </Typography>
                                        )}
                                        {question.targetAudiences?.length > 0 && (
                                          <Box sx={{ mt: 0.5, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                            <Typography variant="body2"><strong>Target Audiences:</strong></Typography>
                                            {question.targetAudiences.map((aud, idx) => (
                                              <Chip key={idx} label={aud} size="small" />
                                            ))}
                                          </Box>
                                        )}
                                        {question.visibility && (
                                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                                            <strong>Visibility:</strong> {question.visibility}
                                          </Typography>
                                        )}
                                        {question.tags?.length > 0 && (
                                          <Box sx={{ mt: 0.5, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                            <Typography variant="body2"><strong>Tags:</strong></Typography>
                                            {question.tags.map((tag, idx) => (
                                              <Chip key={idx} label={tag} size="small" variant="outlined" />
                                            ))}
                                          </Box>
                                        )}
                                      </Box>
                                    </Grid>
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
                                    {question.attachments?.length > 0 && (
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
                                </AccordionDetails>
                              </Accordion>
                            );
                          })}
                        </AccordionDetails>
                      </Accordion>
                    );
                  })}
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
    </Box>
  );
}
