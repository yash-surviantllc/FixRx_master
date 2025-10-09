import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Switch,
  Alert,
  Platform,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootStackParamList, MainTabParamList } from '../types/navigation';
import { MaterialIcons, MaterialCommunityIcons, Feather, Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

type ProfileScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Profile'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { userProfile, setUserProfile, logout } = useAppContext();
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [tapCount, setTapCount] = useState(0);

  // Mock data for user stats
  const userStats = [
    { label: 'Bookings', value: '12' },
    { label: 'Reviews', value: '8', rating: '4.8' },
    { label: 'Saved', value: '5' },
  ];

  const accountItems = [
    {
      id: 'appearance',
      title: 'Dark Mode',
      icon: <Ionicons name="moon-outline" size={24} color={colors.secondaryText} />,
      rightComponent: (
        <Switch
          value={isDarkMode}
          onValueChange={toggleTheme}
          trackColor={{ false: '#E5E7EB', true: '#D1E0FF' }}
          thumbColor={isDarkMode ? '#3B82F6' : '#9CA3AF'}
        />
      ),
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: <Ionicons name="notifications-outline" size={24} color={colors.secondaryText} />,
      onPress: () => navigation.navigate('NotificationSettings'),
      rightComponent: (
        <Switch
          value={notificationsEnabled}
          onValueChange={setNotificationsEnabled}
          trackColor={{ false: '#E5E7EB', true: '#D1E0FF' }}
          thumbColor={notificationsEnabled ? '#3B82F6' : '#9CA3AF'}
        />
      ),
    },
    {
      id: 'notifications-settings',
      title: 'Notification Settings',
      icon: <Ionicons name="settings-outline" size={24} color={colors.secondaryText} />,
      onPress: () => navigation.navigate('NotificationSettings'),
    },
    {
      id: 'privacy',
      title: 'Account & Security',
      icon: <MaterialIcons name="security" size={24} color={colors.secondaryText} />,
      onPress: () => navigation.navigate('AccountSettings'),
    },
  ];

  const supportItems = [
    {
      id: 'help',
      title: 'Help Center',
      icon: <MaterialIcons name="help-outline" size={24} color={colors.secondaryText} />,
      onPress: () => navigation.navigate('HelpCenter'),
    },
    {
      id: 'terms',
      title: 'Terms & Privacy',
      icon: <MaterialIcons name="description" size={24} color={colors.secondaryText} />,
      onPress: () => navigation.navigate('HelpSupport'),
    },
  ];

  const handleLogout = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log Out',
          onPress: () => {
            logout();
            // Reset navigation stack and go to Welcome screen
            navigation.reset({
              index: 0,
              routes: [{ name: 'Welcome' as never }],
            });
          },
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <ScrollView>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.headerBackground, borderBottomColor: colors.border }]}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.primaryText }]}>Profile</Text>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => navigation.navigate('AccountSettings')}
          >
            <Feather name="edit-3" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Profile Info */}
        <View style={[styles.profileSection, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: userProfile?.profileImage || 'https://via.placeholder.com/100' }} 
              style={styles.avatar}
              defaultSource={{ uri: 'https://via.placeholder.com/100' }}
            />
            <TouchableOpacity style={styles.cameraButton}>
              <MaterialIcons name="camera-alt" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.userName, { color: colors.primaryText }]}>
            {userProfile?.firstName} {userProfile?.lastName}
          </Text>
          
          {userProfile?.businessName && (
            <Text style={[styles.businessName, { color: colors.secondaryText }]}>
              {userProfile.businessName}
            </Text>
          )}
          
          <Text style={[styles.userEmail, { color: colors.secondaryText }]}>
            {userProfile?.email}
          </Text>
          
          <View style={styles.statsContainer}>
            {userStats.map((stat, index) => (
              <View key={index} style={[styles.statItem, { borderRightColor: colors.border }]}>
                <Text style={[styles.statValue, { color: colors.primaryText }]}>
                  {stat.value}
                  {stat.rating && <Text style={styles.ratingText}>★</Text>}
                </Text>
                <Text style={[styles.statLabel, { color: colors.secondaryText }]}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionHeader, { color: colors.secondaryText }]}>ACCOUNT</Text>
          <View style={[styles.menuContainer, { backgroundColor: colors.cardBackground }]}>
            {accountItems.map((item) => (
              <TouchableOpacity 
                key={item.id}
                style={[styles.menuItem, { borderBottomColor: colors.border }]}
                onPress={item.onPress}
                disabled={!item.onPress}
              >
                <View style={styles.menuIcon}>{item.icon}</View>
                <Text style={[styles.menuText, { color: colors.primaryText }]}>{item.title}</Text>
                {item.rightComponent ? (
                  item.rightComponent
                ) : (
                  <MaterialIcons 
                    name="keyboard-arrow-right" 
                    size={24} 
                    color={colors.secondaryText} 
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Support Section */}
        <View style={[styles.sectionContainer, { marginTop: 16 }]}>
          <Text style={[styles.sectionHeader, { color: colors.secondaryText }]}>SUPPORT</Text>
          <View style={[styles.menuContainer, { backgroundColor: colors.cardBackground }]}>
            {supportItems.map((item) => (
              <TouchableOpacity 
                key={item.id}
                style={[styles.menuItem, { borderBottomColor: colors.border }]}
                onPress={item.onPress}
                disabled={!item.onPress}
              >
                <View style={styles.menuIcon}>{item.icon}</View>
                <Text style={[styles.menuText, { color: colors.primaryText }]}>{item.title}</Text>
                <MaterialIcons 
                  name="keyboard-arrow-right" 
                  size={24} 
                  color={colors.secondaryText} 
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
          onPress={handleLogout}
        >
          <MaterialIcons name="logout" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
        {/* Easter egg - shows quote on 4 taps (non-intrusive)  */}
        <TouchableOpacity 
          style={styles.versionContainer}
          onPress={() => {
            const newCount = tapCount + 1;
            setTapCount(newCount);
            console.log(newCount);
            if (newCount === 4) {
              if(Platform.OS !== 'web'){
                Alert.alert(
                  'This developer is a gamer',
                  'Most people think time is like a river, that flows swift and sure in one direction. But I have seen the face of time, and I can tell you, they are wrong! Time is an ocean in a storm.',
                  [
                    {
                      text: 'Rewind Time',
                      onPress: () => setTapCount(0)
                    }
                  ]
                );
              }else{
                alert('Most people think time is like a river, that flows swift and sure in one direction. But I have seen the face of time, and I can tell you, they are wrong! Time is an ocean in a storm.');
                setTapCount(0);
              }
            }
          }}
          activeOpacity={0.9}
        >
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: colors.secondaryText }]}>About</Text>
            <Text style={[styles.versionText, { color: colors.secondaryText }]}>
              v1.0.0
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  editButton: {
    padding: 8,
  },
  profileSection: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#3B82F6',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  businessName: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  ratingText: {
    color: '#F59E0B',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  sectionContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomColor: '#F3F4F6',
  },
  menuIcon: {
    width: 40,
    alignItems: 'center',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 8,
  },
  themeSwitchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeSwitch: {
    marginHorizontal: 6,
    transform: Platform.OS === 'ios' ? [] : [{ scale: 0.8 }],
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  logoutText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '500',
    marginLeft: 8,
  },
  versionContainer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aboutLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  versionText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  copyrightText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

export default ProfileScreen;
