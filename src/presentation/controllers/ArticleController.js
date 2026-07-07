const ArticlesRepository = require("../../infrastructure/repositories/ArticlesRepository");
const ArticleUseCase = require("../../application/usecase/ArticleUseCase");

class ArticleController {

    constructor(ArticleUseCase) {
        this.useCase = ArticleUseCase;
    }

    getAll = async (req, res) => {
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
        res.status(500).json({ success: false, message: err.message });
    }
};

    getOne = async (req, res) => {
        try {
            const article = await this.useCase.getArticleById(req.params.id);
            res.json({ success: true, data: article });
        } catch (err) {
            res.status(404).json({ success: false, message: err.message });
        }
    };

    create = async (req, res) => {
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
        res.status(400).json({ success: false, message: err.message });
    }
};

    update = async (req, res) => {
        try {
            await this.useCase.updateArticle(req.params.id, req.body);
            res.json({ success: true, message: "Artikel berhasil diperbarui" });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    };

    delete = async (req, res) => {
        try {
            await this.useCase.deleteArticle(req.params.id);
            res.json({ success: true, message: "Artikel berhasil dihapus" });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    };
}

module.exports = ArticleController;