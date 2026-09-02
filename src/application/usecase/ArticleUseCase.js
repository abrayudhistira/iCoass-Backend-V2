const fs = require('fs');
const path = require('path');
const { NotFoundError, ValidationError } = require('../domain/errors/AppError');

class ArticleUseCase {
    constructor(articlesRepository, sequelize) {
        this.articlesRepository = articlesRepository;
        this.sequelize = sequelize;
    }

    async getAllArticles(page = 1, limit = 10) {
        return await this.articlesRepository.findAll(page, limit);
    }

    async getArticleById(id) {
        const article = await this.articlesRepository.findById(id);
        if (!article) throw new NotFoundError("Artikel");
        return article;
    }

    async createArticle(data) {
        if (!data.title || data.title.length < 5) throw new ValidationError("Judul minimal 5 karakter");
        if (!data.content) throw new ValidationError("Konten artikel tidak boleh kosong");

        return await this.articlesRepository.create(data);
    }

    async updateArticle(id, data) {
        return await this.sequelize.transaction(async (t) => {
            const article = await this.articlesRepository.findById(id, t);
            if (!article) throw new NotFoundError("Artikel");
            await this.articlesRepository.update(id, data, t);
            return await this.articlesRepository.findById(id, t);
        });
    }

    async deleteArticle(id) {
        return await this.sequelize.transaction(async (t) => {
            const article = await this.articlesRepository.findById(id, t);
            if (!article) throw new NotFoundError("Artikel");

            // Jika artikel punya image_url, hapus file fisiknya (after transaction commits ideally)
            if (article.image_url) {
                const absolutePath = path.join(__dirname, '../../../public', article.image_url);
                if (fs.existsSync(absolutePath)) {
                    // Use async fs for non-blocking
                    await fs.promises.unlink(absolutePath).catch(() => {}); // Ignore error if file not found
                }
            }

            return await this.articlesRepository.delete(id, t);
        });
    }
}

module.exports = ArticleUseCase;