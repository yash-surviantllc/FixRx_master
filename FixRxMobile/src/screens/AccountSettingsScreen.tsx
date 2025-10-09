import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Image,
  SafeAreaView,
  StatusBar,
  Alert,
  Switch
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAppContext } from '../context/AppContext';
import { RootStackParamList } from '../types/navigation';

type AccountSettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AccountSettings'>;

const AccountSettingsScreen: React.FC = () => {
  const navigation = useNavigation<AccountSettingsScreenNavigationProp>();
  const { colors, isDarkMode } = useTheme();
  const { userProfile, setUserProfile } = useAppContext();

  // Profile state
  const [firstName, setFirstName] = useState(userProfile?.firstName || '');
  const [lastName, setLastName] = useState(userProfile?.lastName || '');
  const [email, setEmail] = useState(userProfile?.email || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [businessName, setBusinessName] = useState(userProfile?.businessName || '');
  
  // Security state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);

  const handleSave = () => {
    // Update user profile
    setUserProfile({
      ...userProfile!,
      firstName,
      lastName,
      email,
      phone,
      businessName,
    });

    Alert.alert(
      'Success',
      'Your profile has been updated successfully',
      [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  const handleChangePassword = () => {
    Alert.alert(
      'Change Password',
      'Password change functionality will be implemented soon',
      [{ text: 'OK' }]
    );
  };

  const handleChangeProfileImage = () => {
    Alert.alert(
      'Change Profile Image',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: () => console.log('Take Photo') },
        { text: 'Choose from Library', onPress: () => console.log('Choose from Library') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.headerBackground, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.primaryText }]}>Account & Security</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={[styles.saveButtonText, { color: colors.primary }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Profile Image Section */}
        <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>Profile Photo</Text>
          <View style={styles.profileImageContainer}>
            <Image 
              source={{ uri: userProfile?.profileImage || 'https://via.placeholder.com/100' }} 
              style={styles.profileImage}
            />
            <TouchableOpacity 
              style={[styles.changeImageButton, { backgroundColor: colors.primary }]}
              onPress={handleChangeProfileImage}
            >
              <MaterialIcons name="camera-alt" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={[styles.imageHint, { color: colors.secondaryText }]}>
            Tap to change your profile photo
          </Text>
        </View>

        {/* Personal Information Section */}
        <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>Personal Information</Text>
          
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.secondaryText }]}>First Name</Text>
            <TextInput
              style={[styles.input, { color: colors.primaryText, borderColor: colors.border, backgroundColor: colors.background }]}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter first name"
              placeholderTextColor={colors.secondaryText}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.secondaryText }]}>Last Name</Text>
            <TextInput
              style={[styles.input, { color: colors.primaryText, borderColor: colors.border, backgroundColor: colors.background }]}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter last name"
              placeholderTextColor={colors.secondaryText}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.secondaryText }]}>Email</Text>
            <TextInput
              style={[styles.input, { color: colors.primaryText, borderColor: colors.border, backgroundColor: colors.background }]}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter email"
              placeholderTextColor={colors.secondaryText}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.secondaryText }]}>Phone Number</Text>
            <TextInput
              style={[styles.input, { color: colors.primaryText, borderColor: colors.border, backgroundColor: colors.background }]}
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter phone number"
              placeholderTextColor={colors.secondaryText}
              keyboardType="phone-pad"
            />
          </View>

          {userProfile?.userType === 'vendor' && (
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.secondaryText }]}>Business Name</Text>
              <TextInput
                style={[styles.input, { color: colors.primaryText, borderColor: colors.border, backgroundColor: colors.background }]}
                value={businessName}
                onChangeText={setBusinessName}
                placeholder="Enter business name"
                placeholderTextColor={colors.secondaryText}
              />
            </View>
          )}
        </View>

        {/* Security Section */}
        <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>Security</Text>
          
          <TouchableOpacity 
            style={[styles.securityItem, { borderBottomColor: colors.border }]}
            onPress={handleChangePassword}
          >
            <View style={styles.securityItemLeft}>
              <MaterialIcons name="lock-outline" size={24} color={colors.secondaryText} />
              <Text style={[styles.securityItemText, { color: colors.primaryText }]}>Change Password</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.secondaryText} />
          </TouchableOpacity>

          <View style={[styles.securityItem, { borderBottomColor: colors.border }]}>
            <View style={styles.securityItemLeft}>
              <MaterialIcons name="verified-user" size={24} color={colors.secondaryText} />
              <View>
                <Text style={[styles.securityItemText, { color: colors.primaryText }]}>Two-Factor Authentication</Text>
                <Text style={[styles.securityItemSubtext, { color: colors.secondaryText }]}>
                  Add an extra layer of security
                </Text>
              </View>
            </View>
            <Switch
              value={twoFactorEnabled}
              onValueChange={setTwoFactorEnabled}
              trackColor={{ false: '#E5E7EB', true: '#D1E0FF' }}
              thumbColor={twoFactorEnabled ? '#3B82F6' : '#9CA3AF'}
            />
          </View>

          <View style={[styles.securityItem, { borderBottomWidth: 0 }]}>
            <View style={styles.securityItemLeft}>
              <Ionicons name="finger-print" size={24} color={colors.secondaryText} />
              <View>
                <Text style={[styles.securityItemText, { color: colors.primaryText }]}>Biometric Login</Text>
                <Text style={[styles.securityItemSubtext, { color: colors.secondaryText }]}>
                  Use fingerprint or face ID
                </Text>
              </View>
            </View>
            <Switch
              value={biometricsEnabled}
              onValueChange={setBiometricsEnabled}
              trackColor={{ false: '#E5E7EB', true: '#D1E0FF' }}
              thumbColor={biometricsEnabled ? '#3B82F6' : '#9CA3AF'}
            />
          </View>
        </View>

        {/* Privacy Section */}
        <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>Privacy</Text>
          
          <TouchableOpacity 
            style={[styles.securityItem, { borderBottomColor: colors.border }]}
            onPress={() => console.log('Privacy Settings')}
          >
            <View style={styles.securityItemLeft}>
              <MaterialIcons name="visibility-off" size={24} color={colors.secondaryText} />
              <Text style={[styles.securityItemText, { color: colors.primaryText }]}>Privacy Settings</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.secondaryText} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.securityItem, { borderBottomWidth: 0 }]}
            onPress={() => console.log('Data & Storage')}
          >
            <View style={styles.securityItemLeft}>
              <MaterialIcons name="storage" size={24} color={colors.secondaryText} />
              <Text style={[styles.securityItemText, { color: colors.primaryText }]}>Data & Storage</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.secondaryText} />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: '#EF4444' }]}>Danger Zone</Text>
          
          <TouchableOpacity 
            style={[styles.dangerItem]}
            onPress={() => Alert.alert(
              'Delete Account',
              'Are you sure you want to delete your account? This action cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => console.log('Delete Account') },
              ]
            )}
          >
            <MaterialIcons name="delete-outline" size={24} color="#EF4444" />
            <Text style={styles.dangerItemText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    padding: 4,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginTop: 16,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  changeImageButton: {
    position: 'absolute',
    bottom: 0,
    right: '38%',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageHint: {
    fontSize: 14,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  securityItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  securityItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  securityItemSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  dangerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  dangerItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#EF4444',
  },
});

export default AccountSettingsScreen;
