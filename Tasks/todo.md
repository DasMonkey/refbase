# Fix Upcoming Events Auto-Refresh and Scrolling Issues

## Problems Identified
1. **Auto-refresh not working**: Upcoming events don't refresh when new events are created within 7 days
2. **Viewport/scrolling issues**: Events cards appear below viewport, no proper scrolling
3. **Missing scrollbar styling**: Need well-designed scrollbars instead of default white ones

## Root Causes

### 1. Auto-Refresh Issue
- **Stale closure problem**: The `refreshUpcomingEvents` function reference was getting stale in the useCallback dependency
- **Timing issues**: State updates weren't properly synchronized between components
- **Function reference instability**: Using useState for function storage caused reference issues

### 2. Scrolling Issues  
- **No height constraints**: UpcomingEvents component had no maximum height limits
- **Poor container structure**: Missing flex layout and overflow handling
- **No scrollbar styling**: Default scrollbars didn't match application theme

## TODO Tasks

- [x] Fix the TypeError: refreshUpcomingEvents is not a function
- [x] Ensure proper function reference handling for refresh  
- [x] Test the corrected auto-refresh functionality
- [x] Verify scrolling works properly in upcoming events

## Solutions Implemented

### 1. Fixed Auto-Refresh with useRef Pattern (src/components/CalendarTab.tsx)

**Problem**: Function references getting stale in useCallback dependencies
**Solution**: Used `useRef` to store function reference and avoid stale closures

```typescript
// Before (problematic useState approach)
const [refreshUpcomingEvents, setRefreshUpcomingEvents] = useState<(() => Promise<void>) | null>(null);

// After (stable useRef approach)  
const refreshUpcomingEventsRef = useRef<(() => Promise<void>) | null>(null);
const setRefreshUpcomingEvents = useCallback((fn) => {
  refreshUpcomingEventsRef.current = fn;
}, []);
```

### 2. Enhanced Scrolling Architecture (src/components/UpcomingEvents.tsx)

**Added proper flex layout and overflow handling:**
- Container: `flex flex-col h-full` - full height container
- Header: `flex-shrink-0` - fixed header that doesn't shrink  
- Content: `flex-1 min-h-0 overflow-y-auto` - scrollable content area
- Scrollbar: `dark-scrollbar` / `light-scrollbar` classes for theming

### 3. Updated Calendar Layout (src/components/CalendarTab.tsx)

**Fixed container hierarchy:**
- Calendar section: Removed `flex-1` to allow fixed sizing
- Upcoming events: Added `flex-1 min-h-0 flex flex-col` for proper space allocation
- Removed `maxEvents={5}` limit in favor of scrolling

## Technical Changes

### Auto-Refresh Fix
- **CalendarTab.tsx:300-315**: Replaced useState with useRef for function storage
- **CalendarTab.tsx:93**: Added explicit refresh call in EventModal success handler  
- **CalendarTab.tsx:668**: Pass refreshAllEvents to EventModal onSuccess prop
- **CalendarTab.tsx:1**: Added useRef to React imports

### Scrolling Fix
- **UpcomingEvents.tsx:90**: Added `flex flex-col h-full` to main container
- **UpcomingEvents.tsx:95**: Added `flex-shrink-0` to header
- **UpcomingEvents.tsx:105**: Added `flex-1 min-h-0 overflow-y-auto` with scrollbar classes
- **UpcomingEvents.tsx:60**: Removed maxEvents limiting logic
- **CalendarTab.tsx:445**: Removed flex-1 from calendar section  
- **CalendarTab.tsx:498**: Added proper flex layout to upcoming events container

### Cleanup
- Removed "Show more" indicator since we now use scrolling
- Removed debug console logs  
- Cleaned up unused hasMoreEvents logic

## Results

### ✅ Auto-Refresh Fixed
- Events now refresh immediately when created/updated within 7 days
- Both main calendar and upcoming events stay synchronized
- No more stale function reference errors
- Proper async handling of refresh operations

### ✅ Scrolling Fixed  
- Upcoming events section now has proper height constraints
- Smooth scrolling with custom styled scrollbars matching app theme
- All events visible through scrolling (no arbitrary limits)
- Proper viewport detection and container sizing

### ✅ User Experience Improved
- Real-time updates in both calendar views
- Intuitive scrolling behavior with visual scrollbar feedback
- Responsive layout that works on different screen sizes
- Clean, consistent design language throughout

## How It Works Now

1. **Create Event** → EventModal calls onSuccess after successful creation
2. **Refresh Trigger** → refreshAllEvents called explicitly with proper function references  
3. **Dual Refresh** → Both main calendar and upcoming events refresh simultaneously
4. **Real-time Display** → New events appear immediately in upcoming section
5. **Scrollable Content** → All events accessible through smooth scrolling with themed scrollbars