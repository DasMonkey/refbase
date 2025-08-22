# Fix BlockNote Content Conversion Functions

## Problem Analysis
The current `stringToBlocks` and `blocksToString` functions in `src/utils/blockNoteUtils.ts` are causing `[object Object]` to display instead of actual text content. The issue is that:

1. BlockNote uses **inline content arrays** for text content, not plain strings
2. The current implementation tries to set `content` as a string directly on blocks
3. BlockNote expects `content` to be an array of inline content objects like `[{type: "text", text: "Hello"}]`

## Current Issues
- Line 352: `stringToBlocks(selectedBug.content)` converts string to blocks incorrectly
- Line 353: `blocksToString(blocks)` converts blocks back to string incorrectly  
- BlockNote content should use inline content format: `{content: [{type: "text", text: "content"}]}`

## Research Required
Using BlockNote 0.35.0, need to find the proper API methods for:
- Converting markdown/plain text to BlockNote blocks
- Converting BlockNote blocks back to markdown/string format
- Using proper inline content structure

## TODO Tasks

- [ ] Research BlockNote 0.35.0 API documentation for proper conversion methods
- [ ] Look for built-in serialization functions like `blocksToMarkdownLossy`, `markdownToBlocks`  
- [ ] Find the correct inline content structure for BlockNote blocks
- [ ] Test the current conversion functions to understand exact failure points
- [ ] Implement corrected `stringToBlocks` function with proper inline content
- [ ] Implement corrected `blocksToString` function with proper serialization
- [ ] Test the fixes with different content types (paragraphs, headings, lists, images)
- [ ] Ensure backward compatibility with existing database content
- [ ] Verify the BlockEditor displays content correctly without [object Object]

## Files to Update
- `src/utils/blockNoteUtils.ts` - Fix conversion functions
- Test the fix in `src/components/BugsTab.tsx` where the functions are used

## Goals
- Replace broken conversion functions with working ones
- Support plain text paragraphs, headings, lists, images
- Eliminate [object Object] display issues
- Maintain compatibility with existing stored content