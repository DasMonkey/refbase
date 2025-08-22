# Markdown Editor Image Support Implementation Plan

## Overview
Add multimedia support to the bug reporting markdown editor with private Supabase storage, image compression, and click-to-expand functionality.

## Requirements
- Private Supabase image storage (user-only access)
- Paste screenshots directly (Ctrl+V)
- Drag & drop image files
- Auto-compression and thumbnail generation
- Click-to-expand images to full size
- Optimized image formats (WebP)

## Implementation Steps

### Phase 1: Supabase Storage Setup
- [ ] **1.1** Create private Supabase storage bucket
  - Bucket name: `bug-images`
  - Public: `false`
  - Location: `/project-id/bug-id/`
- [ ] **1.2** Set up Row Level Security (RLS) policies
  - Users can only access images from their projects
  - Authenticated access only
- [ ] **1.3** Test bucket creation and access permissions

### Phase 2: Image Processing Utilities
- [ ] **2.1** Create image compression utility
  - Target formats: WebP (primary), JPEG (fallback)
  - Thumbnail: 300px width, 80% quality
  - Full size: 1200px max width, 85% quality
- [ ] **2.2** Create image resizing function using Canvas API
  - Maintain aspect ratio
  - Handle different input formats (PNG, JPEG, WebP)
- [ ] **2.3** Add file validation
  - Max file size: 10MB
  - Allowed formats: PNG, JPEG, WebP, GIF
  - Security checks for file headers

### Phase 3: Upload Service
- [ ] **3.1** Create Supabase upload service
  - Generate unique filenames (timestamp + uuid)
  - Upload both thumbnail and full-size versions
  - Return signed URLs for private access
- [ ] **3.2** Add upload progress tracking
  - Loading states during upload
  - Error handling for failed uploads
- [ ] **3.3** Implement file cleanup on bug deletion
  - Remove associated images when bug is deleted

### Phase 4: Enhanced Markdown Editor
- [ ] **4.1** Add drag & drop functionality
  - Detect file drag over editor
  - Visual drop zone indicator
  - Handle multiple files
- [ ] **4.2** Add paste functionality  
  - Listen for paste events
  - Extract images from clipboard data
  - Support for screenshot paste
- [ ] **4.3** Integrate with existing EnhancedEditor
  - Modify existing component
  - Maintain current functionality
  - Add image upload callbacks

### Phase 5: Image Display & Modal
- [ ] **5.1** Create image markdown renderer
  - Custom markdown-it plugin for images
  - Render thumbnails inline
  - Add click handlers
- [ ] **5.2** Create expandable image modal
  - Full-screen overlay
  - Zoom functionality
  - Navigation for multiple images
  - Close on ESC/click outside
- [ ] **5.3** Add loading states and error handling
  - Image loading spinners
  - Broken image fallbacks
  - Retry mechanisms

### Phase 6: UI/UX Enhancements
- [ ] **6.1** Add image upload controls
  - Upload button in editor toolbar
  - Drag & drop visual feedback
  - Progress indicators
- [ ] **6.2** Image management features
  - Delete images from editor
  - Reorder images
  - Add alt text/captions
- [ ] **6.3** Responsive design
  - Mobile-friendly image handling
  - Touch gestures for modal
  - Optimized for different screen sizes

### Phase 7: Security & Performance
- [ ] **7.1** Implement proper authentication checks
  - Verify user can access project/bug
  - Secure signed URL generation
  - Token refresh handling
- [ ] **7.2** Add rate limiting
  - Max uploads per minute
  - File size limits enforcement
  - Abuse prevention
- [ ] **7.3** Performance optimizations
  - Lazy loading for images
  - Image caching strategies
  - Compression quality optimization

### Phase 8: Testing & Polish
- [ ] **8.1** Unit tests for image utilities
  - Compression functions
  - Upload service
  - Validation logic
- [ ] **8.2** Integration tests
  - End-to-end image upload flow
  - Permission testing
  - Error scenarios
- [ ] **8.3** User experience testing
  - Cross-browser compatibility
  - Mobile device testing
  - Performance benchmarking

## Technical Architecture

### File Structure
```
src/
  services/
    imageUpload.ts       # Supabase upload service
    imageProcessing.ts   # Compression & resizing
  components/
    ui/
      EnhancedEditor.tsx # Modified with image support
      ImageModal.tsx     # Expandable image viewer
  hooks/
    useImageUpload.ts   # Upload state management
  utils/
    imageValidation.ts  # File validation utilities
```

### Storage Structure
```
bug-images/
  {project-id}/
    {bug-id}/
      {timestamp}-{uuid}-thumb.webp  # Thumbnail (300px)
      {timestamp}-{uuid}-full.webp   # Full size (1200px max)
```

### Markdown Format
```markdown
# Bug Description
Login button is broken.

![Alt text](storage-url/thumbnail.webp "Click to expand")

Steps to reproduce...
```

## Dependencies to Add
- `canvas` (for image processing) - built into browsers
- Enhanced markdown-it plugins for image handling
- File validation utilities

## Database Schema Changes
```sql
-- Add image metadata table (optional, for better tracking)
CREATE TABLE bug_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bug_id uuid REFERENCES bugs(id) ON DELETE CASCADE,
  filename text NOT NULL,
  original_name text NOT NULL,
  file_size integer NOT NULL,
  thumbnail_url text NOT NULL,
  full_url text NOT NULL,
  created_at timestamptz DEFAULT now(),
  uploaded_by uuid REFERENCES auth.users(id)
);
```

## Success Metrics
- [ ] Users can paste screenshots directly into editor
- [ ] Images upload and display correctly
- [ ] Click-to-expand works smoothly
- [ ] Images are private and secure
- [ ] Performance remains good with multiple images
- [ ] Mobile experience is optimized

## Risk Mitigation
- **Large file sizes**: Implement compression and size limits
- **Storage costs**: Monitor usage, implement cleanup policies
- **Security**: Private buckets, proper RLS policies
- **Performance**: Lazy loading, thumbnail optimization
- **Browser compatibility**: Fallbacks for older browsers

## Notes
- Start with Phase 1 (storage setup) to establish foundation
- Test each phase thoroughly before moving to next
- Keep existing markdown functionality intact
- Maintain consistent theming (dark/light mode)
- Follow existing code patterns and conventions