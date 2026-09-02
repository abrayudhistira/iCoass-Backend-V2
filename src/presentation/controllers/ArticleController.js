const { ValidationError } = require('../../domain/errors/AppError');

class ArticleController {

    constructor(ArticleUseCase) {
        this.useCase = ArticleUseCase;
    }

    getAll = async (req, res, next) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            const result = await this.useCase.getAllArticles(page, limit);

            res.json({
                success: true,
                data: result.rows,
                meta: {
                    totalData: result.count,
                    currentPage: page,
                    totalPages: Math.ceil(result.count / limit)
                }
            });
        } catch (err) {
            next(err);
        }
    };

    getOne = async (req, res, next) => {
        try {
            const article = await this.useCase.getArticleById(req.params.id);
            res.json({ success: true, data: article });
        } catch (err) {
            next(err);
        }
    };

    create = async (req, res, next) => {
        try {
            const { title, content } = req.body;
            let imageUrl = null;

            if (req.file) {
                imageUrl = `/uploads/articles/${req.file.filename}`;
            }

            const newArticle = await this.useCase.createArticle({
                title,
                content,
                image_url: imageUrl
            });

            res.status(201).json({ success: true, data: newArticle });
        } catch (err) {
            next(err);
        }
    };

    update = async (req, res, next) => {
        try {
            await this.useCase.updateArticle(req.params.id, req.body);
            res.json({ success: true, message: "Artikel berhasil diperbarui" });
        } catch (err) {
            next(err);
        }
    };

    delete = async (req, res, next) => {
        try {
            await this.useCase.deleteArticle(req.params.id);
            res.json({ success: true, message: "Artikel berhasil dihapus" });
        } catch (err) {
            next(err);
        }
    };
}

module.exports = ArticleController;