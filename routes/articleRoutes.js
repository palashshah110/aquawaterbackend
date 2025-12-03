const express = require('express');
const router = express.Router();
const { uploadArticleImage } = require('../config/cloudinary');
const {
  getArticles,
  getAllArticlesAdmin,
  getArticleById,
  getArticleCategories,
  getArticleTags,
  createArticle,
  updateArticle,
  deleteArticle,
  getRelatedArticles,
} = require('../controllers/articleController');

// Public routes
router.get('/', getArticles);
router.get('/categories', getArticleCategories);
router.get('/tags', getArticleTags);

// Admin routes (in production, add auth middleware)
router.get('/admin/all', getAllArticlesAdmin);
router.post('/', uploadArticleImage, createArticle);
router.put('/:id', uploadArticleImage, updateArticle);
router.delete('/:id', deleteArticle);

// Single article routes (must be after other specific routes)
router.get('/:idOrSlug', getArticleById);
router.get('/:id/related', getRelatedArticles);

module.exports = router;
