const Article = require('../models/Article');
const cloudinary = require('cloudinary').v2;

// @desc    Get all articles (public - only published)
// @route   GET /api/articles
// @access  Public
const getArticles = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      tag,
      featured,
      search,
    } = req.query;

    const query = { isPublished: true };

    if (category) {
      query.category = category;
    }

    if (tag) {
      query.tags = { $in: [tag] };
    }

    if (featured === 'true') {
      query.isFeatured = true;
    }

    if (search) {
      query.$text = { $search: search };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const articles = await Article.find(query)
      .select('-content') // Exclude full content for list view
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    const total = await Article.countDocuments(query);

    res.json({
      success: true,
      data: articles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get articles error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching articles',
      error: error.message,
    });
  }
};

// @desc    Get all articles (admin - including unpublished)
// @route   GET /api/articles/admin/all
// @access  Private/Admin
const getAllArticlesAdmin = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      category,
      search,
    } = req.query;

    const query = {};

    if (status === 'published') {
      query.isPublished = true;
    } else if (status === 'draft') {
      query.isPublished = false;
    }

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const articles = await Article.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Article.countDocuments(query);

    res.json({
      success: true,
      data: articles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get all articles admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching articles',
      error: error.message,
    });
  }
};

// @desc    Get single article by ID or slug
// @route   GET /api/articles/:idOrSlug
// @access  Public
const getArticleById = async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const { admin } = req.query;

    let article;

    // Check if it's a valid MongoDB ObjectId
    if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
      article = await Article.findById(idOrSlug);
    } else {
      article = await Article.findOne({ slug: idOrSlug });
    }

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found',
      });
    }

    // If not admin request, only return published articles and increment views
    if (admin !== 'true') {
      if (!article.isPublished) {
        return res.status(404).json({
          success: false,
          message: 'Article not found',
        });
      }

      // Increment view count
      article.views += 1;
      await article.save();
    }

    res.json({
      success: true,
      data: article,
    });
  } catch (error) {
    console.error('Get article error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching article',
      error: error.message,
    });
  }
};

// @desc    Get article categories
// @route   GET /api/articles/categories
// @access  Public
const getArticleCategories = async (req, res) => {
  try {
    const categories = await Article.distinct('category', { isPublished: true });

    res.json({
      success: true,
      data: categories.filter(Boolean),
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message,
    });
  }
};

// @desc    Get article tags
// @route   GET /api/articles/tags
// @access  Public
const getArticleTags = async (req, res) => {
  try {
    const tags = await Article.aggregate([
      { $match: { isPublished: true } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);

    res.json({
      success: true,
      data: tags.map((t) => ({ name: t._id, count: t.count })),
    });
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tags',
      error: error.message,
    });
  }
};

// @desc    Create article
// @route   POST /api/articles
// @access  Private/Admin
const createArticle = async (req, res) => {
  try {
    const {
      title,
      excerpt,
      content,
      category,
      tags,
      authorName,
      isPublished,
      isFeatured,
      metaTitle,
      metaDescription,
    } = req.body;

    const articleData = {
      title,
      excerpt,
      content,
      category: category || 'General',
      tags: tags ? JSON.parse(tags) : [],
      author: {
        name: authorName || 'Admin',
      },
      isPublished: isPublished === 'true' || isPublished === true,
      isFeatured: isFeatured === 'true' || isFeatured === true,
      metaTitle,
      metaDescription,
    };

    // Handle image upload
    if (req.file) {
      articleData.featuredImage = {
        url: req.file.path,
        publicId: req.file.filename,
      };
    }

    const article = await Article.create(articleData);

    res.status(201).json({
      success: true,
      message: 'Article created successfully',
      data: article,
    });
  } catch (error) {
    console.error('Create article error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating article',
      error: error.message,
    });
  }
};

// @desc    Update article
// @route   PUT /api/articles/:id
// @access  Private/Admin
const updateArticle = async (req, res) => {
  try {
    const {
      title,
      excerpt,
      content,
      category,
      tags,
      authorName,
      isPublished,
      isFeatured,
      metaTitle,
      metaDescription,
    } = req.body;

    let article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found',
      });
    }

    const updateData = {
      title: title || article.title,
      excerpt: excerpt !== undefined ? excerpt : article.excerpt,
      content: content || article.content,
      category: category || article.category,
      tags: tags ? JSON.parse(tags) : article.tags,
      author: {
        name: authorName || article.author.name,
        avatar: article.author.avatar,
      },
      isPublished: isPublished !== undefined
        ? (isPublished === 'true' || isPublished === true)
        : article.isPublished,
      isFeatured: isFeatured !== undefined
        ? (isFeatured === 'true' || isFeatured === true)
        : article.isFeatured,
      metaTitle: metaTitle !== undefined ? metaTitle : article.metaTitle,
      metaDescription: metaDescription !== undefined ? metaDescription : article.metaDescription,
    };

    // Handle new image upload
    if (req.file) {
      // Delete old image from Cloudinary if exists
      if (article.featuredImage && article.featuredImage.publicId) {
        try {
          await cloudinary.uploader.destroy(article.featuredImage.publicId);
        } catch (err) {
          console.error('Error deleting old image:', err);
        }
      }

      updateData.featuredImage = {
        url: req.file.path,
        publicId: req.file.filename,
      };
    }

    article = await Article.findByIdAndUpdate(req.params.id, updateData, {
      new: true
    });

    res.json({
      success: true,
      message: 'Article updated successfully',
      data: article,
    });
  } catch (error) {
    console.error('Update article error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating article',
      error: error.message,
    });
  }
};

// @desc    Delete article
// @route   DELETE /api/articles/:id
// @access  Private/Admin
const deleteArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found',
      });
    }

    // Delete image from Cloudinary if exists
    if (article.featuredImage && article.featuredImage.publicId) {
      try {
        await cloudinary.uploader.destroy(article.featuredImage.publicId);
      } catch (err) {
        console.error('Error deleting image:', err);
      }
    }

    await Article.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Article deleted successfully',
    });
  } catch (error) {
    console.error('Delete article error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting article',
      error: error.message,
    });
  }
};

// @desc    Get related articles
// @route   GET /api/articles/:id/related
// @access  Public
const getRelatedArticles = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found',
      });
    }

    // Find articles with same category or tags
    const relatedArticles = await Article.find({
      _id: { $ne: article._id },
      isPublished: true,
      $or: [
        { category: article.category },
        { tags: { $in: article.tags } },
      ],
    })
      .select('-content')
      .sort({ publishedAt: -1 })
      .limit(4);

    res.json({
      success: true,
      data: relatedArticles,
    });
  } catch (error) {
    console.error('Get related articles error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching related articles',
      error: error.message,
    });
  }
};

module.exports = {
  getArticles,
  getAllArticlesAdmin,
  getArticleById,
  getArticleCategories,
  getArticleTags,
  createArticle,
  updateArticle,
  deleteArticle,
  getRelatedArticles,
};
