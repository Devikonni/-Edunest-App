import React, { useState, useRef, useEffect } from 'react';
import { View, Modal, Text, DrawerLayoutAndroid, StyleSheet, Animated, Alert, TouchableOpacity, Dimensions, Button, ScrollView, TextInput, Switch, ActivityIndicator } from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import MapView, { Polygon, LatLng, Region, Circle, Polyline, Marker,Callout, Geojson } from 'react-native-maps';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Sidebar from './components/sidebar';
import * as turf from '@turf/turf';
import { jsondata} from './components/IndexValue';
import { vizagdata } from './components/vizag';
import BootSplash from 'react-native-bootsplash';
import { schooldata } from './components/AppSchool';
import StudyAreaComponent from './components/studyarea';
import DataSetOverview from './components/datasets';
import AppBox from './components/appbox';
import PopupModal from './components/animate';
interface Layer {
  id: string;
  name: string;
  visible: boolean;
}

interface KMLData {
  [x: string]: any;
  polygons: LatLng[][];
  markers: LatLng[];
  color: string;
  filename: string;
}
interface FeatureProperties {
  Id: string;
  Schools: string;
  Transport: string;
  LULC: string;
  Slope: string;
  Pop: string;
  Water: string;
  IndexValue: string;
  schname: string;
  school_cat: string;
  Accessibility: string; 
  // Add more properties if needed
}

interface Feature {
  properties: FeatureProperties;
  // Add other properties as needed
}
const Stack = createStackNavigator();

const App = () => {
  useEffect (() => {
    BootSplash.hide();
  }, []);
  const [kmlDataList, setKmlDataList] = useState<KMLData[]>([]);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // State for forced map refresh
  const [mapRegion, setMapRegion] = useState<Region | null>(null); // State to hold map region
  const colors = ['rgba(255,0,0,0.5)', 'rgba(0,255,0,0.5)', 'rgba(0,0,255,0.5)', 'rgba(255,255,0,0.5)', 'rgba(255,0,255,0.5)'];
  const mapRef = useRef(null); // Ref for MapView component
  const [showCallout, setShowCallout] = useState(false);
  const drawerRef = useRef<DrawerLayoutAndroid>(null); // Ref for DrawerLayoutAndroid component
  const [clickedPoint, setClickedPoint] = useState<LatLng | null>(null);
  const [nearestFeatureJsonData, setNearestFeatureJsonData] = useState<Feature | null>(null);
  const [nearestFeatureSchoolData, setNearestFeatureSchoolData] = useState<Feature | null>(null);
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [showAhpTable, setShowAhpTable] = useState(false); // State to toggle AHP table
  const [loading, setLoading] = useState(false);
  const [messageVisible, setMessageVisible] = useState(false);
  const [message1Visible, setMessage1Visible] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const criteria = ['School', 'LULC', 'Water', 'Transport', 'Elevation', 'Population'];
  const initialMatrix = [
    [1,     2,     3,     4,     5,   6],
    [0.5,   1,     3,     2,     5,   4],
    [0.333, 0.333, 1,     2,     3,   4],
    [0.25,  0.5,   0.5,   1,     2,   3],
    [0.2,   0.2,   0.333, 0.5,   1,   2],
    [0.167, 0.25,  0.25,  0.333, 0.5, 1]
  ];
  const [pairwiseMatrix, setPairwiseMatrix] = useState(initialMatrix);
  const [criteriaWeights, setCriteriaWeights] = useState(Array(6).fill(0));
  const [indexValue, setIndexValue] = useState([]);
   

  const pickFile = async () => {
    try {
      setLoading(true);
      setShowMessage(true);
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
      });

      if (result) {
        console.log('File URI:', result[0]?.uri);
        const content = await RNFS.readFile(result[0]?.uri, 'utf8');
        const parsedKmlData = parseKml(content, result[0]?.name || '');
        console.log('Parsed KML:', parsedKmlData);
        setKmlDataList([...kmlDataList, parsedKmlData]);
        addLayer(parsedKmlData, parsedKmlData.filename);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to read file');
      console.error('Error picking file:', error);
    } finally {
      setLoading(false);
      
    }
  };
  const dismissMessage = () => {
    setShowMessage(false);
  };

  const addLayer = (kmlData: KMLData, layerName: string) => {
    const newLayer: Layer = {
      id: `${layerName.toLowerCase()}_layer_${layers.length + 1}`,
      name: layerName,
      visible: true,
    };
    setLayers([...layers, newLayer]);
    if (kmlData.markers.length > 0 || kmlData.polygons.length > 0 || kmlData.lines.length > 0) {
      // Calculate the bounds of markers or polygons
      const bounds = calculateBounds(kmlData.markers, kmlData.polygons, kmlData.lines);
      // Set the map region to fit the calculated bounds
      setMapRegion(bounds);
    }
  };

  const calculateBounds = (markers: LatLng[], polygons: LatLng[][], lines: LatLng[][]): Region => {
    let minLat = Number.MAX_VALUE;
    let maxLat = Number.MIN_VALUE;
    let minLng = Number.MAX_VALUE;
    let maxLng = Number.MIN_VALUE;
  
    markers.forEach(marker => {
      minLat = Math.min(minLat, marker.latitude);
      maxLat = Math.max(maxLat, marker.latitude);
      minLng = Math.min(minLng, marker.longitude);
      maxLng = Math.max(maxLng, marker.longitude);
    });
  
    polygons.forEach(polygon => {
      polygon.forEach(point => {
        minLat = Math.min(minLat, point.latitude);
        maxLat = Math.max(maxLat, point.latitude);
        minLng = Math.min(minLng, point.longitude);
        maxLng = Math.max(maxLng, point.longitude);
      });
    });
  
    lines.forEach(line => {
      line.forEach(point => {
        minLat = Math.min(minLat, point.latitude);
        maxLat = Math.max(maxLat, point.latitude);
        minLng = Math.min(minLng, point.longitude);
        maxLng = Math.max(maxLng, point.longitude);
      });
    });
  
    const latitudeDelta = Math.abs(maxLat - minLat) * 1.1; 
    const longitudeDelta = Math.abs(maxLng - minLng) * 1.1; 
  
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta,
      longitudeDelta,
    };
  };
  

  const parseKml = (kmlContent: string, filename: string): KMLData => {
    const coordinatesRegex = /<coordinates>(.*?)<\/coordinates>/g;
    const polygons: LatLng[][] = [];
    const lines: LatLng[][] = [];
    const markers: LatLng[] = [];
  
    let match;
    while ((match = coordinatesRegex.exec(kmlContent)) !== null) {
      const coordinatesStr = match[1].trim();
      const coordinates = coordinatesStr.split(' ');
  
      if (coordinates.length > 2) {
        // Polygon or line
        if (coordinates.length > 3 && coordinates[0] === coordinates[coordinates.length - 1]) {
          // Polygon
          const polygonCoordinates = coordinates.map(coord => {
            const [longitude, latitude] = coord.split(',');
            return { latitude: parseFloat(latitude), longitude: parseFloat(longitude) };
          });
          polygons.push(polygonCoordinates);
        } else {
          // Line
          const lineCoordinates = coordinates.map(coord => {
            const [longitude, latitude] = coord.split(',');
            return { latitude: parseFloat(latitude), longitude: parseFloat(longitude) };
          });
          lines.push(lineCoordinates);
        }
      } else if (coordinates.length === 1) {
        // Marker
        const [longitude, latitude] = coordinates[0].split(',');
        markers.push({ latitude: parseFloat(latitude), longitude: parseFloat(longitude) });
      }
    }
  
    return { polygons, lines, markers, color: colors[kmlDataList.length % colors.length], filename };
  };
  
  const refreshMap = () => {
    setKmlDataList([]);
    setLayers([]);
    setRefreshKey(prevKey => prevKey + 1);
    console.log('Refreshing map...');
  };

  const performUnion = () => {
    let totalPolygons = 0;
    (kmlDataList || []).forEach(kmlData => {
      totalPolygons += kmlData.polygons.length;
    });

    if (totalPolygons < 2) {
      Alert.alert('Error', 'Please select at least two polygons for union operation');
      return;
    }

    const unionedPolygons: LatLng[][] = [];
    (kmlDataList || []).forEach(kmlData => {
      kmlData.polygons.forEach((polygon: LatLng[]) => {
        unionedPolygons.push(polygon);
      });
    });

    setKmlDataList([{ polygons: unionedPolygons, markers: [], color: 'rgba(0,0,0,0.5)', filename: 'Union' }]);
    addLayer({ polygons: unionedPolygons, markers: [], lines: [], color: 'rgba(0,0,0,0.5)', filename: 'Union' }, 'Union');
  };

  const performIntersection = () => {
    if (!kmlDataList || kmlDataList.length < 2) {
      Alert.alert('Error', 'Please select at least two KML files for intersection operation');
      return;
    }
  
    let intersectionPolygons: LatLng[][] = [];
  
    // Iterate over all pairs of polygons from different KML files
    for (let i = 0; i < kmlDataList.length - 1; i++) {
      for (let j = i + 1; j < kmlDataList.length; j++) {
        const polygonsA = kmlDataList[i].polygons;
        const polygonsB = kmlDataList[j].polygons;
  
        // Compute intersection between each pair of polygons
        for (const polygonA of polygonsA) {
          for (const polygonB of polygonsB) {
            const intersect = turf.intersect(
              turf.polygon([polygonA.map((coord: { longitude: any; latitude: any; }) => [coord.longitude, coord.latitude])]),
              turf.polygon([polygonB.map((coord: { longitude: any; latitude: any; }) => [coord.longitude, coord.latitude])])
            );
            if (intersect && intersect.geometry.coordinates.length > 0) {
              intersectionPolygons.push(intersect.geometry.coordinates[0].map((coord: any[]) => ({
                latitude: coord[1],
                longitude: coord[0],
              })));
            }
          }
        }
      }
    }
  
    // Update the KML data list with the intersection polygons
    setKmlDataList([{ polygons: intersectionPolygons, markers: [], color: 'rgba(0,0,0,0.5)', filename: 'Intersection' }]);
    addLayer({ polygons: intersectionPolygons, markers: [], lines: [], color: 'rgba(0,0,0,0.5)', filename: 'Intersection' }, 'Intersection');
  };


  const performBuffer = (bufferDistance: number) => {
    if (!kmlDataList || kmlDataList.length === 0) {
        Alert.alert('Error', 'Please select at least one KML file or add point data to perform buffer operation');
        return;
    }
  
    setKmlDataList(prevKmlDataList => {
        const newDataList = prevKmlDataList.map(kmlData => {
            // For each marker, buffer it and add the resulting polygon to the markers list
            const bufferedMarkers = kmlData.markers.flatMap((marker: LatLng) => bufferPoint(marker, bufferDistance));
            const bufferedPolygons = kmlData.polygons.map((polygon: LatLng[]) => bufferPolygon(polygon, bufferDistance));
            const bufferedLines = kmlData.lines.map((line: LatLng[]) => bufferLine(line, bufferDistance));
        
            return {
                ...kmlData,
                markers: kmlData.markers, // Keep original markers unchanged
                polygons: [...kmlData.polygons, ...bufferedMarkers, ...bufferedPolygons], // Add buffered markers and polygons
                lines: [...kmlData.lines, ...bufferedLines], // Add buffered lines 
              };
        });
        
        return newDataList;
    });
    addLayer({ polygons: [], markers: [], lines: [], color: 'rgba(128,0,128,0.5)', filename: 'Buffered' }, 'Buffered');
  };
  
  const bufferPoint = (point: LatLng, distance: number): LatLng[][] => {
    const center = [point.longitude, point.latitude];
    const bufferedCircle = turf.circle(center, distance);
    const coordinates = bufferedCircle.geometry.coordinates[0].map((coord: any[]) => ({
      latitude: coord[1],
      longitude: coord[0],
    }));

    // Return as a polygon, adding the first point at the end to close the polygon
    return [[...coordinates, coordinates[0]]];
  };

  const bufferPolygon = (polygon: LatLng[], distance: number): LatLng[] => {
    const turfPolygon = turf.polygon([polygon.map(coord => [coord.longitude, coord.latitude])]);
    const bufferedPolygon = turf.buffer(turfPolygon, distance);
    return turf.getCoords(bufferedPolygon)[0].map((coord: any[]) => ({ latitude: coord[1], longitude: coord[0] }));
  };

  const bufferLine = (line: LatLng[], distance: number): LatLng[][] => {
      // Check if the line data is valid
      if (!line || line.length === 0) {
          console.error('Invalid line data');
          return [];
      }
  
      // Convert line coordinates to turf.js compatible format
      const turfLine = turf.lineString(line.map(coord => [coord.longitude, coord.latitude]));
      
      // Buffer the line to create a polygon
      let bufferedLine;
      try {
          bufferedLine = turf.buffer(turfLine, distance, { units: 'meters' }); // Adjust units as per your requirement
      } catch (error) {
          console.error('Buffering operation failed:', error);
          return [];
      }
  
      // Convert the resulting polygon to an array of LatLng objects
      const coordinates = bufferedLine.geometry.coordinates[0].map((coord: any[]) => ({
          latitude: coord[1],
          longitude: coord[0],
      }));
  
      // If the resulting coordinates have less than 4 points, duplicate the start and end points
      while (coordinates.length < 4) {
          coordinates.unshift(coordinates[0]);
          coordinates.push(coordinates[coordinates.length - 1]);
      }
  
      return [coordinates];
  };
  const performDissolve = () => {
    const allPolygons = kmlDataList.flatMap(kmlData => kmlData.polygons);
    const turfPolygons = allPolygons.map(polygon => turf.polygon([polygon.map((coord: { longitude: any; latitude: any; }) => [coord.longitude, coord.latitude])]));
    const dissolved = turf.union(...turfPolygons);
    
    setKmlDataList([{ polygons: [turf.getCoords(dissolved)[0].map((coord: any[]) => ({ latitude: coord[1], longitude: coord[0] }))], markers: [], color: 'lightgray', filename: 'Dissolved' }]);
    addLayer({ polygons: [turf.getCoords(dissolved)[0].map((coord: any[]) => ({ latitude: coord[1], longitude: coord[0] }))], markers: [], lines: [], color: 'lightgray', filename: 'Dissolved' }, 'Dissolved');
  };
 
const performClip = () => {
    if (!kmlDataList || kmlDataList.length < 2) {
      Alert.alert('Error', 'Please select at least two KML files for clip analysis');
      return;
    }
  
    const clippedPolygons: LatLng[][] = [];
    const clipPolygon = kmlDataList[0].polygons[0]; // Assuming the first polygon will be used as the clip polygon
  
    // Iterate over the rest of the polygons for clipping
    for (let i = 1; i < kmlDataList.length; i++) {
      const polygonsToClip = kmlDataList[i].polygons;
  
      // Clip each polygon in the layer with the clip polygon
      for (const polygon of polygonsToClip) {
        const clippedPolygon = turf.intersect(
          turf.polygon([clipPolygon.map((coord: { longitude: any; latitude: any; }) => [coord.longitude, coord.latitude])]),
          turf.polygon([polygon.map((coord: { longitude: any; latitude: any; }) => [coord.longitude, coord.latitude])])
        );
  
        if (clippedPolygon && clippedPolygon.geometry && clippedPolygon.geometry.coordinates) {
          clippedPolygons.push(clippedPolygon.geometry.coordinates[0].map((coord: any[]) => ({
            latitude: coord[1],
            longitude: coord[0],
          })));

        }
      }
    }
    // Update the KML data list with the clipped polygons
    setKmlDataList([{ polygons: clippedPolygons, markers: [], color: 'rgba(0,0,0,0.5)', filename: 'Clipped' }]);
    addLayer({ polygons: clippedPolygons, markers: [], lines: [], color: 'rgba(0,0,0,0.5)', filename: 'Clipped' }, 'Clipped');
  };

  const openDrawer = () => {
    drawerRef.current?.openDrawer();
  };

//function to handle map press  
  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    const coordinate = [longitude, latitude]; // Convert to Turf.js format
    const isInside = turf.booleanPointInPolygon(coordinate, vizagdata.features[0].geometry);
    
    if (!isInside) {
      // Clicked outside the polygon, show warning
      Alert.alert(
        'Warning',`\nCoordinates: 
        Latitude ${latitude.toFixed(6)},
         Longitude ${longitude.toFixed(6)}
You clicked outside the Visakhapatnam boundary.`
    );
    } else { 
      // Clicked inside the polygon, show popup or perform any other action
      setClickedPoint({ latitude, longitude });
  // Convert clicked point to Turf.js point
  const clickedTurfPoint: any = turf.point([longitude, latitude]);

  // Find nearest point in JSON data
  const nearestJsonPoint: Feature = turf.nearestPoint(clickedTurfPoint, jsondata) as Feature;
  const nearestSchoolPoint: Feature = turf.nearestPoint(clickedTurfPoint, schooldata) as Feature;
// Set nearest feature states
    setNearestFeatureJsonData(nearestJsonPoint);
    setNearestFeatureSchoolData(nearestSchoolPoint);
    setShowPopup(true);
    }
    setShowCallout(true);
    setMessageVisible(true);

  };

  const handleMarkerPress = () => {
    setMessageVisible(false);
  };

  const handleCalloutPress = () => {
    setShowCallout(false);
  };
  

// Function to handle change in pairwise comparison matrix
const handlePairwiseMatrixChange = (rowIndex: number, colIndex: number, value: string) => {
  const newValue = value === '' ? null : parseFloat(value);
  const updatedMatrix = [...pairwiseMatrix];

  if (rowIndex === colIndex) {
    updatedMatrix[rowIndex][colIndex] = 1; // Set diagonal values to 1
  } else {
    updatedMatrix[rowIndex][colIndex] = newValue || 0
    updatedMatrix[colIndex][rowIndex] = newValue !== null ? 1 / newValue : null as any;
  }
  setPairwiseMatrix(updatedMatrix);
};

const getCellStyle = (rowIndex: number, colIndex: number, value: number ) => {
  // Check if the current cell is in the upper triangular part of the matrix
  if (colIndex > rowIndex && value !== 1) {
    return { ...styles.cell, backgroundColor: 'rgba(255, 255, 0, 1)' }; // Apply color to cells in upper triangular part with value not equal to 1
  } else {
    return styles.cell; // Return regular style for other cells
  }
};

// Function to calculate priorities based on pairwise comparison matrix
const calculatePriorities = () => {
  const rowProducts = pairwiseMatrix.map(row => row.reduce((acc, val) => acc * val, 1));
  const geometricMeans = rowProducts.map(product => Math.pow(product, 1 / 6));
  const sum = geometricMeans.reduce((acc, val) => acc + val, 0);
  const normalizedGeometricMeans = geometricMeans.map(val => (val / sum).toFixed(3)); // Round to 3 decimal places
  setCriteriaWeights(normalizedGeometricMeans);
};

// Function to calculate index value based on criteria weights and feature properties
const calculateIndexValue = (properties: { Schools: any; LULC: any; Water: any; Transport: any; Slope: any; Pop: any; }) => {
const weights = criteriaWeights;
const { Schools, LULC, Water, Transport, Slope, Pop } = properties;
const indexValue = (Schools * weights[0]) + (LULC * weights[1]) + (Water * weights[2]) + (Transport * weights[3]) + (Slope * weights[4]) + (Pop * weights[5]);
return indexValue.toFixed(0); // Round index value to 0 decimal places
};

// Update criteria weights when pairwise matrix changes
useEffect(() => {
  calculatePriorities();
}, []);
// Update nearest feature JSON data when clicked point changes
// Update nearest feature JSON data when clicked point changes
// Update nearest feature JSON data when clicked point changes
useEffect(() => {
  if (nearestFeatureJsonData && clickedPoint) {
    const indexValue = calculateIndexValue(nearestFeatureJsonData.properties);
    let Accessibility = '';
    if (indexValue >= 80) {
        Accessibility = 'Very highly suitable for ideal school';
    } else if (indexValue >= 60) {
        Accessibility = 'Highly suitable for ideal school';
    } else if (indexValue >= 40) {
        Accessibility = 'Moderately suitabile for ideal school';
    } else if (indexValue >= 20) {
        Accessibility = 'Low suitabile for ideal school';
    } else {
        Accessibility = 'Not suitable for ideal school';
    }
    if (indexValue !== nearestFeatureJsonData.properties.IndexValue) {
      setNearestFeatureJsonData(prevData => ({
        ...prevData!,
        properties: {
          ...prevData!.properties,
          IndexValue: indexValue,
          Accessibility: Accessibility
        }
      }));
    }
  }
}, [clickedPoint, criteriaWeights]); // Include both dependencies

const toggleAhpTable = () => {
  setShowAhpTable(!showAhpTable);
};
const closeModal = () => {
  setModalVisible(false);
};

const toggleMessage1 = () => {
  setMessage1Visible(!message1Visible);
};

{/*const renderMessage = () => {
  if (kmlDataList.length > 0) {
    return (
      <View style={styles.messageContainer}>
        <Text style={styles.messageText}>Click on the refresh button to remove file from the map.</Text>
        <TouchableOpacity style={styles.dismissButton} onPress={() => setModalVisible(false)}>
          <Text style={styles.dismissButtonText}>Tap to dismiss</Text>
        </TouchableOpacity>
      </View>
    );
  }
return null;
};*/}
  return (
    <NavigationContainer>
    <Stack.Navigator>
      <Stack.Screen name="Home" options={{ headerShown: false }}>
        {() => (

    <DrawerLayoutAndroid
      ref={drawerRef}
      drawerWidth={200}
      drawerPosition="left"
      renderNavigationView={() => (
        <Sidebar
          pickFile={pickFile}
          layers={layers}
          AHPmatrix={toggleAhpTable}
         performUnion={performUnion}
          performBuffer={performBuffer}
          performIntersection={performIntersection}
          performDissolve={performDissolve}
          performClip={performClip}/>
      )}>
      <View style={{ flex: 1 }}>
     
         {/* AHP Table Modal */}
      <Modal
          animationType="slide"
          transparent={true}
          visible={showAhpTable}
          onRequestClose={() => setShowAhpTable(false)}>
          {/* Modal Content */}
          <View style={styles.modalContainer}>
          <View style={styles.modalContent}>

          <ScrollView horizontal={true}>
  <View style={styles.tableContainer}>

                <Text style={styles.header}>Pairwise Comparison Matrix for School Accessibility Index 
</Text>
                <View style={styles.tableContainer}>
                    <View style={styles.table}>
                        <View style={styles.tableRow}>
                            <View style={[styles.cell, { flex: 2 }]}></View>
                            {criteria.map((criterion, index) => (
                                <Text key={index} style={[styles.cell, styles.headerCell, { flex: 1 }]}>{criterion}</Text>
                            ))}
                            <Text style={[styles.cell, styles.headerCell, { flex: 1 }]}>Weights</Text>
  </View>
                        {criteria.map((rowCriterion, rowIndex) => (
                            <View key={rowIndex} style={styles.tableRow}>
                                <Text style={[styles.cell, { flex: 2 }]}>{rowCriterion}</Text>
                               
                                {criteria.map((_colCriterion, colIndex) => (
                                    <TextInput
                                        key={colIndex}
                                        style={[getCellStyle(rowIndex, colIndex), { flex: 1 }]}
                                        value={pairwiseMatrix[rowIndex][colIndex] ? pairwiseMatrix[rowIndex][colIndex].toString() : ''}
                                        onChangeText={(value) => handlePairwiseMatrixChange(rowIndex, colIndex, value)}
                                        keyboardType="numeric"
                                    />
                                    
                                ))}
                                <Text style={[styles.cell, { flex: 1 }]}>{criteriaWeights[rowIndex]}</Text>
                            </View>
                        ))}
                    </View>
                </View>
                <Button title="Calculate Weights" onPress={calculatePriorities} />
 </View>            
 </ScrollView>
 <TouchableOpacity style={styles.closeButton} onPress={toggleAhpTable}>
    <Text>Close</Text>
  </TouchableOpacity>
 </View>
</View>
        </Modal>
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}>
          {/* Modal Content */}

        </Modal>
        <View style={styles.mapContainer}>
        <MapView
          onPress={handleMapPress}
          ref={mapRef}
        key={refreshKey}
          style={styles.map}
          initialRegion={{
            latitude: 17.910123,
            longitude: 82.662067,
            latitudeDelta: 2,
            longitudeDelta: 2,
          }}
          region={mapRegion as Region}
          zoomEnabled={true}
          zoomControlEnabled={true}
          >
            <Geojson geojson={vizagdata} />
            
          {(kmlDataList || []).map((kmlData, index) => (
            <React.Fragment key={index}>
              {/* Render original polygons */}
              {layers.map((layer, idx) => (
                layer.visible &&
                kmlData.polygons.map((coordinates: LatLng[], cIdx: any) => (
                  <Polygon key={`poly_${index}_${idx}_${cIdx}`} coordinates={coordinates} fillColor={kmlData.color} />
                ))
              ))}
              {/* Render buffered polygons with a different color */}
              {layers.map((layer, idx) => (
                layer.visible &&
                kmlData.polygons.map((coordinates: LatLng[], cIdx: any) => (
                  <Polygon key={`buffered_poly_${index}_${idx}_${cIdx}`} coordinates={coordinates} fillColor='rgba(128,128,128,0.5)' />
                ))
              ))}
              {/* Render original markers */}
              {kmlData.markers.map((point: LatLng, idx: any) => (
                <Circle
                  key={`point_${index}_${idx}`}
                  center={point}
                  radius={50}
                  strokeWidth={15}
                  strokeColor="grey" />
              ))}
              {/* Render buffered markers with a different color */}
              {kmlData.markers.map((point: LatLng, idx: any) => (
                <Circle
                  key={`buffered_point_${index}_${idx}`}
                  center={point}
                  radius={50}
                  strokeWidth={15}
                  strokeColor="grey" />
              ))}
               {/* Render lines 
              {kmlData.lines.map((coordinates: any, cIdx: any) => (
                <Polyline key={`line_${index}_${cIdx}`} coordinates={coordinates} fillColor='darkblue'/>
              ))}*/}
                    
              
            </React.Fragment>
          ))}
       
             {showPopup && clickedPoint && nearestFeatureJsonData && showCallout && (
              
                    <Marker
                        coordinate={clickedPoint}
                        title={"Nearest Feature (JSON Data)"}
                        pinColor={"#FF0000"} // Adjust pin color as needed
                        onPress={handleMarkerPress}
                    >
                      
                        <Callout style={styles.callout}
                          onPress={handleCalloutPress}>
                             <ScrollView>
                             <View style={styles.calloutContent}>
                                <Text style={styles.property}>Current Location: {clickedPoint.latitude.toFixed(6)}, {clickedPoint.longitude.toFixed(6)}</Text>
                                <Text style={styles.property}>Nearest School Name: {nearestFeatureSchoolData?.properties?.schname}</Text>
                                <Text style={styles.property}>School Category: {nearestFeatureSchoolData?.properties?.school_cat}</Text>
                                <Text style={styles.property}>1. Schools(ranks): {nearestFeatureJsonData?.properties?.Schools}</Text>
                                <Text style={styles.property}>2. Transport(ranks): {nearestFeatureJsonData?.properties?.Transport}</Text>
                                <Text style={styles.property}>3. LULC(ranks): {nearestFeatureJsonData?.properties?.LULC}</Text>
                                <Text style={styles.property}>4. Slope(ranks): {nearestFeatureJsonData?.properties?.Slope}</Text>
                                <Text style={styles.property}>5. Population(ranks): {nearestFeatureJsonData?.properties?.Pop}</Text>
                                <Text style={styles.property}>6. Water(ranks): {nearestFeatureJsonData?.properties?.Water}</Text>
                                <Text style={styles.property}>7. School Accessibility Index: {nearestFeatureJsonData?.properties?.IndexValue}</Text>
                                <Text style={styles.property}>Accessbility: {nearestFeatureJsonData?.properties?.Accessibility}</Text>
                            </View>
                            </ScrollView>
                        </Callout>
                    </Marker>
                )}

          </MapView>
         
          {loading && (
        <View style={{ position: 'absolute', top: '50%', left: '50%', zIndex: 1 }}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      )}

{messageVisible && (
    <View style={styles.messageContainer}>
      <Text>Click on marker again to get School Accessbility Index</Text>
    </View>
  )}


{showMessage && (
        <TouchableOpacity onPress={dismissMessage} style={styles.messageContainer}>
          <Text style={styles.messageText}>Click on the refresh to remove file from the layer</Text>
          <Text style={styles.dismissText}>Tap to dismiss</Text>
        </TouchableOpacity>
)}
          <AppBox
                    openDrawer={openDrawer}
                     refreshMap={refreshMap}/>
        </View>
        <Button title="! Click Me !" color="#34495E"  onPress={() => setModalVisible(true)}  />
      <PopupModal visible={modalVisible} onClose={closeModal} />
      </View>
     </DrawerLayoutAndroid>
     )}
     </Stack.Screen>
     <Stack.Screen name="StudyAreaComponent" component={StudyAreaComponent} options={{ title: 'User Guide' }} />
     <Stack.Screen name="DataSetOverview" component={DataSetOverview} options={{ title: 'Data Sets' }} />
     </Stack.Navigator>
 </NavigationContainer>
  );
};
const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
  },
  menuButton: { position: 'absolute', top: 20, left: 20, backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 5 },
  //refreshButton: { position: 'absolute', top: 20, right: 20, backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 5},
  callout: {width: 300,
    backgroundColor: '#FFFFFF',
    borderColor: '#000000',
    borderWidth: 1,
    
},
calloutContent: {
  padding: 10,
},
property: {
    marginBottom: 5,
    color: '#000000',
},
scrollView: {
  flexGrow: 1,
  alignItems: 'center',
},
header: {
  fontSize: 20,
  fontWeight: 'bold',
  textAlign: 'center',
  marginTop: 20,
},
tableContainer: {
  width: Dimensions.get('window').width - 20, // Adjust width as needed
  marginBottom: 10,
  overflow: 'scroll', // Enable horizontal scrolling
},
table: {
  flexDirection: 'column',
  borderWidth: 1,
  borderColor: 'black',
  minWidth: '100%', // Ensure table takes up minimum available width
},
tableRow: {
  flexDirection: 'row',
  borderBottomWidth: 1,
  borderBottomColor: 'black',
},
cell: {
  textAlign: 'center',
  borderRightWidth: 1,
  borderRightColor: 'black',
  padding: 10,
  minWidth: 30, // Fallback width for cells
  maxWidth: 50, // Maximum width for cells
},
headerCell: {
  fontWeight: 'bold',
  minWidth: 30, // Fallback width for header cells
  maxWidth: 50, // Maximum width for header cells
},
mapContainer: {
  flex: 1,
  width: '100%',
  height: Dimensions.get('window').height / 2, // Adjust map height as needed
},

toggleContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  marginVertical: 10,
},
ahpTable: {
  position: 'absolute',
  bottom: 20, // Adjust this value as per your layout
  left: 15, // Adjust this value as per your layout
  backgroundColor: 'white',
  padding: 10,
  borderRadius: 5,
},
modalContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.5)', // semi-transparent background
},
modalContent: {
  backgroundColor: 'white',
  padding: 20,
  borderRadius: 10,
  alignItems: 'center',
},
closeButton: {
  marginTop: 10,
  padding: 10,
  backgroundColor: 'lightgray',
  borderRadius: 5,
},
container: {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
},
heading: {
  fontSize: 24,
  fontWeight: 'bold',
  marginBottom: 20,
},

loadingOverlay: {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: 'rgba(255, 255, 255, 0.7)',
  justifyContent: 'center',
  alignItems: 'center',
},
loadingText: {
  marginTop: 10,
  fontSize: 16,
},
messageContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  messageText: {
    fontSize: 16,
  },
 
  dismissButton: {
    marginLeft: 10,
  },
  dismissText: {
    alignSelf: 'flex-end',
    color: 'blue',
  },
});
export default App;