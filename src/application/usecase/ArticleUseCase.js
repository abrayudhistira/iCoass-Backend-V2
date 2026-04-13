const fs = require('fs');
const path = require('path');

class ArticleUseCase {
    constructor(articlesRepository) {
        this.articlesRepository = articlesRepository;
    }

    async getAllArticles() {
        return await this.articlesRepository.findAll();
    }

    async getArticleById(id) {
        const article = await this.articlesRepository.findById(id);
        if (!article) throw new Error("Artikel tidak ditemukan");
        return article;
    }

    async createArticle(data) {
        if (!data.title || data.title.length < 5) throw new Error("Judul minimal 5 karakter");
        if (!data.content) throw new Error("Konten artikel tidak boleh kosong");
        
        return await this.articlesRepository.create(data);
    }

    async updateArticle(id, data) {
        await this.getArticleById(id);
        return await this.articlesRepository.update(id, data);
    }

    async deleteArticle(id) {
    const article = await this.getArticleById(id);
    
    // Jika artikel punya image_url, hapus file fisiknya
    if (article.image_url) {
        const absolutePath = path.join(__dirname, '../../../public', article.image_url);
        if (fs.existsSync(absolutePath)) {
            fs.unlinkSync(absolutePath);
        }
    }
    
    return await this.articlesRepository.delete(id);
}
}

module.exports = ArticleUseCase;