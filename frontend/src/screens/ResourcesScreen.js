import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { Card, Button, Searchbar, Chip } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useLanguage } from '../context/LanguageContext';
import { useOffline } from '../context/OfflineContext';
import { resourcesAPI, offlineAPI } from '../services/api';
import { theme } from '../theme/theme';

const ResourcesScreen = ({ navigation }) => {
  const { t } = useLanguage();
  const { isConnected } = useOffline();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  const resourceTypes = [
    { key: 'all', label: 'All', icon: 'list' },
    { key: 'phc', label: t('phc'), icon: 'local-hospital' },
    { key: 'chc', label: t('chc'), icon: 'business' },
    { key: 'asha', label: t('asha_worker'), icon: 'person' },
  ];

  // Mock resources data
  const mockResources = [
    {
      id: 'phc_001',
      name: 'Primary Health Centre Rampur',
      type: 'PHC',
      distance: 2.5,
      phone: '+91-9876543210',
      address: 'Village Rampur, Block Sohna, Gurugram',
      availability: 'open',
      services: ['General Medicine', 'Maternal Care', 'Vaccination'],
      estimatedTime: '15 minutes'
    },
    {
      id: 'chc_001',
      name: 'Community Health Centre Sohna',
      type: 'CHC',
      distance: 8.2,
      phone: '+91-9876543211',
      address: 'Sohna Road, Gurugram',
      availability: 'open',
      services: ['Emergency', 'Surgery', 'Specialist Consultation'],
      estimatedTime: '25 minutes'
    },
    {
      id: 'asha_001',
      name: 'Sunita Devi (ASHA Worker)',
      type: 'ASHA',
      distance: 0.8,
      phone: '+91-9876543212',
      address: 'Rampur Village',
      availability: 'available',
      services: ['Home Visits', 'Basic Health Check', 'Referrals'],
      estimatedTime: '10 minutes'
    },
    {
      id: 'asha_002',
      name: 'Kamala Sharma (ASHA Worker)',
      type: 'ASHA',
      distance: 1.2,
      phone: '+91-9876543213',
      address: 'Kheri Village',
      availability: 'busy',
      services: ['Maternal Care', 'Child Health', 'Immunization'],
      estimatedTime: '15 minutes'
    }
  ];

  useEffect(() => {
    loadResources();
  }, [selectedType]);

  const loadResources = async () => {
    setLoading(true);
    try {
      let result;
      
      if (isConnected) {
        result = await resourcesAPI.findNearby({
          userLocation: { lat: 28.6139, lng: 77.2090 },
          resourceType: selectedType,
          maxDistance: 50
        });
      } else {
        result = await offlineAPI.findResources(null, selectedType);
      }

      if (result.success) {
        setResources(result.resources || mockResources);
      } else {
        setResources(mockResources);
      }
    } catch (error) {
      console.error('Error loading resources:', error);
      setResources(mockResources);
    } finally {
      setLoading(false);
    }
  };

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || resource.type.toLowerCase() === selectedType.toLowerCase();
    return matchesSearch && matchesType;
  });

  const handleCall = (phone) => {
    Alert.alert(
      'Make Call',
      `Do you want to call ${phone}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => Linking.openURL(`tel:${phone}`) }
      ]
    );
  };

  const handleDirections = (address) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    Linking.openURL(url);
  };

  const getAvailabilityColor = (availability) => {
    switch (availability) {
      case 'open':
      case 'available':
        return theme.colors.success;
      case 'busy':
        return theme.colors.warning;
      case 'closed':
        return theme.colors.error;
      default:
        return theme.colors.placeholder;
    }
  };

  const getTypeIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'phc':
        return 'local-hospital';
      case 'chc':
        return 'business';
      case 'asha':
        return 'person';
      default:
        return 'place';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('find_nearby')}</Text>
        <Text style={styles.subtitle}>Healthcare resources near you</Text>
        
        {/* Connection Status */}
        <View style={[styles.connectionBadge, {
          backgroundColor: isConnected ? theme.colors.success : theme.colors.warning
        }]}>
          <Icon 
            name={isConnected ? 'wifi' : 'wifi-off'} 
            size={16} 
            color={theme.colors.surface} 
          />
          <Text style={styles.connectionText}>
            {isConnected ? 'Live Data' : 'Cached Data'}
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <Searchbar
          placeholder="Search healthcare facilities..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      {/* Filter Chips */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterSection}
        contentContainerStyle={styles.filterContent}
      >
        {resourceTypes.map((type) => (
          <Chip
            key={type.key}
            selected={selectedType === type.key}
            onPress={() => setSelectedType(type.key)}
            style={[
              styles.filterChip,
              {
                backgroundColor: selectedType === type.key
                  ? theme.colors.primary
                  : theme.colors.surface,
              }
            ]}
            textStyle={{
              color: selectedType === type.key
                ? theme.colors.surface
                : theme.colors.text,
            }}
            icon={type.icon}
          >
            {type.label}
          </Chip>
        ))}
      </ScrollView>

      {/* Resources List */}
      <ScrollView style={styles.resourcesList} showsVerticalScrollIndicator={false}>
        {filteredResources.map((resource) => (
          <Card key={resource.id} style={styles.resourceCard}>
            <View style={styles.resourceHeader}>
              <View style={styles.resourceInfo}>
                <View style={styles.resourceTitleRow}>
                  <Icon 
                    name={getTypeIcon(resource.type)} 
                    size={24} 
                    color={theme.colors.primary} 
                  />
                  <Text style={styles.resourceName}>{resource.name}</Text>
                </View>
                
                <View style={styles.resourceMeta}>
                  <View style={styles.distanceContainer}>
                    <Icon name="location-on" size={16} color={theme.colors.placeholder} />
                    <Text style={styles.distance}>{resource.distance} km away</Text>
                  </View>
                  
                  <View style={[
                    styles.availabilityBadge,
                    { backgroundColor: getAvailabilityColor(resource.availability) }
                  ]}>
                    <Text style={styles.availabilityText}>
                      {resource.availability}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.resourceContent}>
              <Text style={styles.address}>{resource.address}</Text>
              
              {resource.services && (
                <View style={styles.servicesContainer}>
                  <Text style={styles.servicesLabel}>Services:</Text>
                  <View style={styles.servicesList}>
                    {resource.services.slice(0, 3).map((service, index) => (
                      <Chip key={index} style={styles.serviceChip} compact>
                        {service}
                      </Chip>
                    ))}
                    {resource.services.length > 3 && (
                      <Text style={styles.moreServices}>
                        +{resource.services.length - 3} more
                      </Text>
                    )}
                  </View>
                </View>
              )}

              <View style={styles.estimatedTime}>
                <Icon name="schedule" size={16} color={theme.colors.info} />
                <Text style={styles.estimatedTimeText}>
                  Estimated travel time: {resource.estimatedTime}
                </Text>
              </View>
            </View>

            <View style={styles.resourceActions}>
              <Button
                mode="contained"
                onPress={() => handleCall(resource.phone)}
                style={styles.callButton}
                icon="phone"
                compact
              >
                {t('call_now')}
              </Button>
              
              <Button
                mode="outlined"
                onPress={() => handleDirections(resource.address)}
                style={styles.directionsButton}
                icon="directions"
                compact
              >
                {t('get_directions')}
              </Button>
            </View>
          </Card>
        ))}

        {filteredResources.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Icon name="search-off" size={64} color={theme.colors.placeholder} />
            <Text style={styles.emptyTitle}>No resources found</Text>
            <Text style={styles.emptyDescription}>
              Try adjusting your search or filter criteria
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Emergency Button */}
      <View style={styles.emergencySection}>
        <Button
          mode="contained"
          onPress={() => handleCall('108')}
          style={styles.emergencyButton}
          contentStyle={styles.emergencyButtonContent}
          icon="emergency"
        >
          Emergency - Call 108
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.md,
    paddingTop: theme.spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.placeholder,
    marginBottom: theme.spacing.md,
  },
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  connectionText: {
    fontSize: 12,
    color: theme.colors.surface,
    marginLeft: theme.spacing.xs,
  },
  searchSection: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  searchBar: {
    backgroundColor: theme.colors.surface,
  },
  filterSection: {
    marginBottom: theme.spacing.md,
  },
  filterContent: {
    paddingHorizontal: theme.spacing.md,
  },
  filterChip: {
    marginRight: theme.spacing.sm,
  },
  resourcesList: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },
  resourceCard: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.small,
  },
  resourceHeader: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderColor,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  resourceName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  resourceMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distance: {
    fontSize: 14,
    color: theme.colors.placeholder,
    marginLeft: theme.spacing.xs,
  },
  availabilityBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  availabilityText: {
    fontSize: 12,
    color: theme.colors.surface,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  resourceContent: {
    padding: theme.spacing.md,
  },
  address: {
    fontSize: 14,
    color: theme.colors.placeholder,
    marginBottom: theme.spacing.md,
  },
  servicesContainer: {
    marginBottom: theme.spacing.md,
  },
  servicesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  servicesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  serviceChip: {
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    backgroundColor: `${theme.colors.primary}20`,
  },
  moreServices: {
    fontSize: 12,
    color: theme.colors.placeholder,
    fontStyle: 'italic',
  },
  estimatedTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  estimatedTimeText: {
    fontSize: 14,
    color: theme.colors.info,
    marginLeft: theme.spacing.xs,
  },
  resourceActions: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    paddingTop: 0,
    gap: theme.spacing.sm,
  },
  callButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  directionsButton: {
    flex: 1,
    borderColor: theme.colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    padding: theme.spacing.xl,
    marginTop: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptyDescription: {
    fontSize: 14,
    color: theme.colors.placeholder,
    textAlign: 'center',
  },
  emergencySection: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderColor,
  },
  emergencyButton: {
    backgroundColor: theme.colors.error,
  },
  emergencyButtonContent: {
    paddingVertical: theme.spacing.sm,
  },
});

export default ResourcesScreen;