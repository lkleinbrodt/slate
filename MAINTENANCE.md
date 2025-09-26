# Maintenance Guide

This guide helps maintain and extend the Slate app effectively.

## 📁 File Organization

### Core App Files

- `app/index.tsx` - Main app screen (single page design)
- `app/settings.tsx` - Settings page
- `app/_layout.tsx` - App layout and providers

### Components

- `components/celebration/` - Celebration system (animations, confetti, haptics)
- `components/TaskItem.tsx` - Task display and interaction
- `components/HabitItem.tsx` - Habit display and interaction
- `components/UnifiedAddModal.tsx` - Add task/habit modal

### Business Logic

- `lib/db/` - Database layer (connection, schema, DAL)
- `lib/stores/` - Zustand state management
- `lib/utils/` - Utility functions (clock, etc.)

### Documentation

- `memory-bank/` - Project documentation and context
- `PLACEHOLDERS.md` - TODO items and missing features
- `MAINTENANCE.md` - This file

## 🔧 Common Maintenance Tasks

### Adding New Features

1. **Check placeholders first** - See `PLACEHOLDERS.md` for planned features
2. **Follow existing patterns** - Use similar component structure and naming
3. **Update documentation** - Add to relevant docs and memory bank
4. **Test thoroughly** - Both simulator and physical device

### Database Changes

1. **Update schema** in `lib/db/schema.ts`
2. **Add migration** in `lib/db/connection.ts`
3. **Update DAL** in `lib/db/dal.ts`
4. **Update types** in `components/types.ts`
5. **Test migration** with existing data

### UI Changes

1. **Follow design system** - Use existing colors, spacing, typography
2. **Maintain accessibility** - Add proper labels and test with VoiceOver
3. **Test animations** - Ensure smooth performance on older devices
4. **Update documentation** - Document new components and patterns

### Performance Optimization

1. **Profile first** - Use React Native performance tools
2. **Optimize animations** - Keep them on UI thread with Reanimated
3. **Batch database operations** - Use transactions for multiple writes
4. **Test on older devices** - Ensure good performance across devices

## 🎨 Celebration System Maintenance

### Adding New Animations

1. **Create component** in `components/celebration/`
2. **Follow TapWin pattern** - Use Reanimated for smooth animations
3. **Add haptic feedback** - Use appropriate haptic types
4. **Test performance** - Ensure 60fps on target devices
5. **Update documentation** - Add to celebration README

### Customizing Existing Animations

1. **Modify timing** - Adjust duration and easing in animation components
2. **Change colors** - Update color schemes in celebration components
3. **Adjust confetti** - Modify particle counts and patterns
4. **Test thoroughly** - Ensure animations feel good and perform well

### Adding Sound Effects

1. **Add audio files** to `assets/sfx/`
2. **Implement playback** using `expo-audio`
3. **Add to celebration components** - Uncomment and implement audio code
4. **Test on device** - Audio doesn't work in simulator

## 🐛 Debugging Common Issues

### Animations Not Working

- Check if Reanimated is properly configured
- Ensure animations run on UI thread
- Test on physical device (simulator may have issues)
- Check for performance bottlenecks

### Haptics Not Working

- Test on physical device (not simulator)
- Check iOS haptic settings
- Ensure proper haptic types are used
- Test with different haptic intensities

### Confetti Not Showing

- Check device performance settings
- Reduce particle count if needed
- Ensure confetti component is properly mounted
- Test on different device types

### Database Issues

- Check SQLite connection
- Verify schema migrations
- Test with different data sizes
- Check for transaction conflicts

### Performance Issues

- Profile with React Native tools
- Check for memory leaks
- Optimize database queries
- Reduce animation complexity if needed

## 📊 Monitoring & Analytics

### Performance Monitoring

- Use React Native performance tools
- Monitor memory usage
- Check animation frame rates
- Test on various device types

### User Experience

- Test with different user scenarios
- Check accessibility compliance
- Verify haptic feedback quality
- Test celebration system effectiveness

### Data Integrity

- Regular database backups
- Test export/import functionality
- Verify data consistency
- Check for data corruption

## 🔄 Update Procedures

### Dependencies

1. **Check for updates** - Review package.json dependencies
2. **Test thoroughly** - Ensure updates don't break functionality
3. **Update documentation** - Note any breaking changes
4. **Update placeholders** - Check if new features are available

### Expo Updates

1. **Check Expo SDK updates** - Review Expo documentation
2. **Update app.json** - Ensure compatibility
3. **Test on devices** - Verify everything still works
4. **Update build process** - Check for new requirements

### React Native Updates

1. **Review breaking changes** - Check React Native changelog
2. **Update components** - Fix any deprecated patterns
3. **Test animations** - Ensure Reanimated still works
4. **Update documentation** - Note any changes needed

## 🧪 Testing Strategy

### Unit Tests

- Test database operations
- Test utility functions
- Test state management
- Test business logic

### Integration Tests

- Test complete user flows
- Test data persistence
- Test celebration system
- Test settings changes

### Manual Testing

- Test on iOS simulator
- Test on physical iOS device
- Test with different data sizes
- Test accessibility features

### Performance Testing

- Test with large datasets
- Test animation performance
- Test memory usage
- Test battery impact

## 📝 Documentation Updates

### When to Update

- After adding new features
- After fixing bugs
- After changing architecture
- After updating dependencies

### What to Update

- README.md - Main project documentation
- PLACEHOLDERS.md - TODO items and missing features
- memory-bank/ - Project context and decisions
- Component READMEs - Specific feature documentation

### How to Update

1. **Be specific** - Include code examples and clear instructions
2. **Keep current** - Remove outdated information
3. **Test examples** - Ensure code examples work
4. **Review regularly** - Check documentation accuracy

## 🚀 Deployment

### Development

- Use Expo development build
- Test on multiple devices
- Verify all features work
- Check performance

### Production

- Build with Expo EAS
- Test thoroughly before release
- Monitor for crashes
- Gather user feedback

## 🔒 Security Considerations

### Data Protection

- All data stored locally
- No network requests
- No third-party analytics
- User data stays on device

### Privacy

- No data collection
- No tracking
- No external services
- Local-first approach

## 📞 Support & Troubleshooting

### Common User Issues

1. **App crashes** - Check device compatibility
2. **Data loss** - Verify backup/restore functionality
3. **Performance** - Check device settings
4. **Animations** - Ensure device supports animations

### Developer Issues

1. **Build failures** - Check dependencies and configuration
2. **Runtime errors** - Check logs and error handling
3. **Performance** - Profile and optimize
4. **Compatibility** - Test on target devices

## 📋 Maintenance Checklist

### Weekly

- [ ] Check for dependency updates
- [ ] Review error logs
- [ ] Test core functionality
- [ ] Check performance metrics

### Monthly

- [ ] Update documentation
- [ ] Review placeholders
- [ ] Test on new devices
- [ ] Check accessibility compliance

### Quarterly

- [ ] Major dependency updates
- [ ] Architecture review
- [ ] Performance optimization
- [ ] Feature planning

---

**Remember**: This app prioritizes user experience and delightful interactions. Always test changes thoroughly and maintain the playful, engaging feel that makes users want to use it daily! 🎉
