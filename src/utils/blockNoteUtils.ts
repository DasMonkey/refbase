/**
 * Utilities for converting between string content and BlockNote blocks
 * Uses proper BlockNote content structure with inline content arrays
 */

import { PartialBlock } from '@blocknote/core';

/**
 * Convert string content (markdown/text) to BlockNote blocks
 */
export const stringToBlocks = (content: string): PartialBlock[] => {
  if (!content?.trim()) {
    return [
      {
        type: 'paragraph',
        content: [],
      }
    ];
  }

  // Split content by lines and convert to blocks
  const lines = content.split('\n');
  const blocks: PartialBlock[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (!trimmedLine) {
      // Empty line - create empty paragraph
      blocks.push({
        type: 'paragraph',
        content: [],
      });
      continue;
    }

    // Check for headers
    if (trimmedLine.startsWith('# ')) {
      blocks.push({
        type: 'heading',
        props: { level: 1 },
        content: [{ type: 'text', text: trimmedLine.substring(2).trim(), styles: {} }],
      });
    } else if (trimmedLine.startsWith('## ')) {
      blocks.push({
        type: 'heading',
        props: { level: 2 },
        content: [{ type: 'text', text: trimmedLine.substring(3).trim(), styles: {} }],
      });
    } else if (trimmedLine.startsWith('### ')) {
      blocks.push({
        type: 'heading',
        props: { level: 3 },
        content: [{ type: 'text', text: trimmedLine.substring(4).trim(), styles: {} }],
      });
    } else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      // Bullet list
      blocks.push({
        type: 'bulletListItem',
        content: [{ type: 'text', text: trimmedLine.substring(2).trim(), styles: {} }],
      });
    } else if (trimmedLine.match(/^\d+\.\s/)) {
      // Numbered list
      blocks.push({
        type: 'numberedListItem',
        content: [{ type: 'text', text: trimmedLine.replace(/^\d+\.\s/, ''), styles: {} }],
      });
    } else if (trimmedLine.startsWith('> ')) {
      // Quote
      blocks.push({
        type: 'paragraph',
        content: [{ type: 'text', text: trimmedLine.substring(2).trim(), styles: {} }],
      });
    } else if (trimmedLine.startsWith('```')) {
      // Code block - for now treat as paragraph
      blocks.push({
        type: 'paragraph',
        content: [{ type: 'text', text: trimmedLine, styles: {} }],
      });
    } else if (trimmedLine.includes('![') && trimmedLine.includes('](')) {
      // Image markdown - convert to image block
      const match = trimmedLine.match(/!\[([^\]]*)\]\(([^)]+)\)/);
      if (match) {
        const [, altText, url] = match;
        blocks.push({
          type: 'image',
          props: {
            url: url.trim(),
            caption: altText.trim() || '',
          },
        });
      } else {
        // Fallback to paragraph
        blocks.push({
          type: 'paragraph',
          content: [{ type: 'text', text: trimmedLine, styles: {} }],
        });
      }
    } else {
      // Regular paragraph
      blocks.push({
        type: 'paragraph',
        content: [{ type: 'text', text: trimmedLine, styles: {} }],
      });
    }
  }

  return blocks.length > 0 ? blocks : [{ type: 'paragraph', content: [] }];
};

/**
 * Convert BlockNote blocks to string content (markdown-like)
 */
export const blocksToString = (blocks: PartialBlock[]): string => {
  if (!blocks) {
    return '';
  }
  
  // Ensure blocks is an array
  if (!Array.isArray(blocks)) {
    console.error('blocksToString: blocks is not an array, received:', blocks);
    return '';
  }
  
  if (blocks.length === 0) {
    return '';
  }

  const lines: string[] = [];

  for (const block of blocks) {
    switch (block.type) {
      case 'heading':
        const level = (block.props as any)?.level || 1;
        const hashes = '#'.repeat(level);
        const headingText = extractTextFromContent(block.content);
        lines.push(`${hashes} ${headingText}`);
        break;
        
      case 'bulletListItem':
        const bulletText = extractTextFromContent(block.content);
        lines.push(`- ${bulletText}`);
        break;
        
      case 'numberedListItem':
        const numberedText = extractTextFromContent(block.content);
        lines.push(`1. ${numberedText}`);
        break;
        
      case 'image':
        const url = (block.props as any)?.url || '';
        const caption = (block.props as any)?.caption || '';
        lines.push(`![${caption}](${url})`);
        break;
        
      case 'paragraph':
      default:
        const paragraphText = extractTextFromContent(block.content);
        lines.push(paragraphText);
        break;
    }
  }

  return lines.join('\n');
};

/**
 * Extract plain text from BlockNote inline content array
 */
function extractTextFromContent(content: any): string {
  if (!content) return '';
  
  if (typeof content === 'string') {
    return content;
  }
  
  if (Array.isArray(content)) {
    return content
      .map(item => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object' && item.text) return item.text;
        if (item && typeof item === 'object' && item.type === 'text') return item.text || '';
        return '';
      })
      .join('');
  }
  
  return '';
}

/**
 * Create empty BlockNote content
 */
export const createEmptyBlocks = (): PartialBlock[] => {
  return [
    {
      type: 'paragraph',
      content: '',
    }
  ];
};

/**
 * Refresh expired image URLs in BlockNote content
 * This function finds image blocks with Supabase signed URLs and regenerates them
 */
export const refreshImageUrls = async (blocks: PartialBlock[], bugId: string): Promise<PartialBlock[]> => {
  const { getBugImages } = await import('../services/imageUpload');
  
  try {
    // Get all images for this bug from the database
    const bugImages = await getBugImages(bugId);
    
    // Create a map of filename to new URL
    const imageUrlMap = new Map<string, string>();
    
    for (const image of bugImages) {
      // Extract filename from the original name or path
      const filename = image.originalName || image.filename;
      imageUrlMap.set(filename, image.thumbnailUrl);
    }
    
    // Process blocks and update image URLs
    const updatedBlocks: PartialBlock[] = [];
    
    for (const block of blocks) {
      if (block.type === 'image') {
        const currentUrl = (block.props as any)?.url || '';
        const caption = (block.props as any)?.caption || '';
        
        // Check if this is a Supabase signed URL that might be expired
        if (currentUrl.includes('supabase') && currentUrl.includes('sign')) {
          // Try to find a matching image by caption (original filename)
          const newUrl = imageUrlMap.get(caption);
          if (newUrl) {
            updatedBlocks.push({
              ...block,
              props: {
                ...block.props,
                url: newUrl
              }
            });
            continue;
          }
        }
      }
      
      // Keep block unchanged
      updatedBlocks.push(block);
    }
    
    return updatedBlocks;
  } catch (error) {
    console.error('Failed to refresh image URLs:', error);
    return blocks; // Return original blocks on error
  }
};