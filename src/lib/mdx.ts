// src/lib/mdx.ts
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const root = process.cwd();

export type Post = {
  slug: string;
  metadata: PostMetadata;
  content?: string; // 可选属性，列表页不包含正文内容
  category: 'dreams' | 'poems';
};

export type PostMetadata = {
  title: string;
  date?: string;   // 用于排序的标准格式 YYYY-MM-DD
  period?: string; // 用于展示的模糊时间
  tags?: string[];
  [key: string]: any;
};

// 获取文章列表，仅返回元数据
export function getPosts(category: 'dreams' | 'poems'): Post[] {
  const dirPath = path.join(root, 'content', category);

  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const files = fs.readdirSync(dirPath);

  const posts = files
    .filter((file) => file.endsWith('.md') || file.endsWith('.mdx'))
    .map((file) => {
      const filePath = path.join(dirPath, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const { data } = matter(fileContent);
      const slug = file.replace(/\.mdx?$/, '');

      return {
        slug,
        metadata: data as PostMetadata,
        category,
      };
    })
    .sort((a, b) => {
      if (a.metadata.date && b.metadata.date) {
        return new Date(b.metadata.date).getTime() - new Date(a.metadata.date).getTime();
      }
      return 0;
    });

  return posts;
}

// 获取单篇文章，包含完整正文内容
export function getPostBySlug(category: 'dreams' | 'poems', slug: string): Post | null {
  try {
    const filePath = path.join(root, 'content', category, `${slug}.md`);
    const filePathMdx = path.join(root, 'content', category, `${slug}.mdx`);

    let targetPath = filePath;
    if (fs.existsSync(filePathMdx)) targetPath = filePathMdx;
    if (!fs.existsSync(targetPath) && !fs.existsSync(filePath)) return null;

    const fileContent = fs.readFileSync(fs.existsSync(targetPath) ? targetPath : filePath, 'utf-8');
    const { data, content } = matter(fileContent);

    return {
      slug,
      metadata: data as PostMetadata,
      content,
      category,
    };
  } catch (e) {
    return null;
  }
}

