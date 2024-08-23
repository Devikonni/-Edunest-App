import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Modal, TextInput, Button} from 'react-native';
import CustomIcon from './icon'; // Import the CustomIcon component
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { CheckBox } from 'react-native-elements';
import Tooltip from 'react-native-walkthrough-tooltip';


const Sidebar = ({pickFile, performUnion,performIntersection, performBuffer, performClip, performDissolve, layers, AHPmatrix}) => {
  const navigation = useNavigation();
  const [activeMenuItem, setActiveMenuItem] = useState(null);
  const [activesubmenuItem, setActivesubmenuItem] = useState(null);
  const [fileLayers, setFileLayers] = useState([]);
  const [bufferSize, setBufferSize] = useState('');
  const [bufferUnit, setBufferUnit] = useState('metres');
  const [bufferDialogVisible, setBufferDialogVisible] = useState(false);
  const [overlaySubMenuVisible, setOverlaySubMenuVisible] = useState(false);
  const [proximitySubMenuVisible, setProximitySubMenuVisible] = useState(false);
  const [ahpTooltipVisible, setAhpTooltipVisible] = useState(false);
  const [genericTooltipVisible, setGenericTooltipVisible] = useState(false);
  const [addkmlfileTooltipVisible, setAddKmlFileTooltipVisible] = useState(false);

  const openAhpTooltip = () => {
    setAhpTooltipVisible(true);
    setGenericTooltipVisible(false); // Close the generic tooltip if open
    setAddKmlFileTooltipVisible(false);
  };

  const openGenericTooltip = () => {
    setGenericTooltipVisible(true);
    setAhpTooltipVisible(false); // Close the AHP tooltip if open
    setAddKmlFileTooltipVisible(false);
  };

  const openAddKmlFileTooltip = () => {
    setGenericTooltipVisible(false);
    setAhpTooltipVisible(false); // Close the AHP tooltip if open
    setAddKmlFileTooltipVisible(true);
  };
  const closeTooltip = () => {
    setAhpTooltipVisible(false);
    setGenericTooltipVisible(false);
    setAddKmlFileTooltipVisible(false);
  };

  const handleMenuItemPress = (item) => {
    setActiveMenuItem(item === activeMenuItem ? null : item);
    if (item === 'layers') {
      setFileLayers(layers.map(layer => ({ name: layer.name, selected: false, visible: true })));
    }
  };

  const handlesubmenuItemPress = (item) => {
    setActivesubmenuItem(item === activesubmenuItem ? null : item);
    if (item === 'layers') {
      setFileLayers(layers.map(layer => ({ name: layer.name, selected: false, visible: true })));
    }
  };

  const handleLayerToggle = (index) => {
    setFileLayers((prevState) =>
      prevState.map((layer, i) => {
        if (i === index) {
          const toggledLayer = { ...layer, selected: !layer.selected };
          toggleMapLayer(toggledLayer.name, toggledLayer.selected); // Toggle map layer visibility
          return toggledLayer;
        }
        return layer;
      })
    );
  };
  
  
  
const toggleMapLayer = (layerName, isVisible) => {
  // Example implementation assuming you have access to a map object
  // Replace this with your actual logic to toggle the visibility of layers on the map
  console.log(`Toggling layer ${layerName} visibility to ${isVisible}`);
  // Here, you should update the visibility status of the layer on the map
};

  const openBufferDialog = () => {
    setBufferDialogVisible(true);
  };

  const closeBufferDialog = () => {
    setBufferDialogVisible(false);
  };

  const handleBufferSizeChange = (text) => {
    setBufferSize(text);
  };

  const handleBufferUnitChange = (value) => {
    setBufferUnit(value);
  };

  const handlePerformBuffer = () => {
    if (performBuffer) {
      performBuffer(bufferSize, bufferUnit);
      setBufferDialogVisible(false);
    } else {
      console.error("performBuffer function is not provided as a prop.");
    }
  };

 const navigateToStudyAreaComponent = () => {
  navigation.navigate('StudyAreaComponent');
 }

const navigateToDataSetOverview = () => {
  navigation.navigate('DataSetOverview');
}

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>EduNest</Text>
      </View>
      <View style={styles.menu}>
      
       
      <TouchableOpacity style={styles.menuItem} onPress={openAhpTooltip}>
        <CustomIcon name="table-edit" size={20} color="black" iconSet="MaterialCommunityIcons" />
        <Text style={styles.menuItemText}>AHP Matrix</Text>
      </TouchableOpacity>
      <Tooltip
        isVisible={ahpTooltipVisible}
        content={
          <View style={styles.tooltipContainer}>
            <Text style={styles.tooltipText}>Click on open to compute weights for School Accessibilty Index</Text>
            <View style={styles.tooltipButtons}>
              <TouchableOpacity style={styles.tooltipButton} onPress={AHPmatrix}>
                <Text>Open</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.tooltipButton} onPress={closeTooltip}>
                <Text>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        onClose={closeTooltip}
        placement="bottom"
      >
        <TouchableOpacity onPress={openAhpTooltip} style={styles.touchableOpacity}></TouchableOpacity>
      </Tooltip>
      
      <TouchableOpacity style={styles.menuItem} onPress={openGenericTooltip}>
          <CustomIcon name="briefcase" size={20} color="#000" />
          <Text style={styles.menuItemText}>Generic Tools</Text>
        </TouchableOpacity>
        <Tooltip
        isVisible={genericTooltipVisible}
        content={
          <View style={styles.tooltipContainer}>
            <Text style={styles.tooltipText}>Click to open Generic Tools and perform spatial analysis</Text>
            <View style={styles.tooltipButtons}>
              <TouchableOpacity style={styles.tooltipButton} onPress={() => {
                  handleMenuItemPress('spatialtoolkit');
                  closeTooltip(); // Close the tooltip when the "Open" button is pressed
                }}>
                <Text>Open</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.tooltipButton} onPress={closeTooltip}>
                <Text>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        onClose={closeTooltip}
        placement="top"
      >
        <TouchableOpacity onPress={openGenericTooltip} style={styles.touchableOpacity}></TouchableOpacity>
      </Tooltip>
        {activeMenuItem === 'spatialtoolkit' && (
          <View style={styles.submenu}>
         
            <TouchableOpacity style={styles.submenuItem} onPress={openAddKmlFileTooltip}>
              <CustomIcon name="file-plus" size={20} color="black" onPress={() => {}} iconSet="Feather" />
              <Text style={styles.submenuItemText}>Add KML File</Text>
            </TouchableOpacity>
            <Tooltip
        isVisible={addkmlfileTooltipVisible}
        content={
          <View style={styles.tooltipContainer}>
            <Text style={styles.tooltipText}>Click on open to Add kml files</Text>
            <View style={styles.tooltipButtons}>
              <TouchableOpacity style={styles.tooltipButton} onPress={pickFile}>
                <Text>Open</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.tooltipButton} onPress={closeTooltip}>
                <Text>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        onClose={closeTooltip}
        placement="bottom"
      >
        <TouchableOpacity onPress={openAddKmlFileTooltip} style={styles.touchableOpacity}></TouchableOpacity>
      </Tooltip>
            <TouchableOpacity style={styles.submenuItem} onPress={() => handlesubmenuItemPress('layers')}>
              <CustomIcon name="layers" size={20} color="black" onPress={() => {}} iconSet="Feather" />
              <Text style={styles.submenuItemText}>Layers</Text>
            </TouchableOpacity>
            {activesubmenuItem === 'layers' && (
              <FlatList
                data={fileLayers}
                renderItem={({ item, index }) => (
                  <View style={styles.submenuItem}>
                    <TouchableOpacity onPress={() => handleLayerToggle(index)}>
                    <CustomIcon
                      name={item.selected ? "eye-slash" : "eye"} // Use item.selected to determine the icon name
                      size={20}
                      color="#000"
                    />
                  </TouchableOpacity>
                    <Text style={styles.submenuItemText}>{item.name}</Text>
                  </View>
                )}
                keyExtractor={(item, index) => index.toString()}
              />
            )}
            <TouchableOpacity style={styles.submenuItem} onPress={() => setOverlaySubMenuVisible(!overlaySubMenuVisible)}>
              <CustomIcon name={overlaySubMenuVisible ? 'object-group' : 'object-ungroup'} size={15} color="#000" />
              <Text style={styles.submenuItemText}>Overlay Analysis</Text>
            </TouchableOpacity>
            {overlaySubMenuVisible && (
              <View style={styles.submenu}>
                <TouchableOpacity style={styles.submenuItem} onPress={performUnion}>
                  <Text style={styles.submenuItemText}>Union</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submenuItem} onPress={performIntersection}>
                  <Text style={styles.submenuItemText}>Intersection</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submenuItem} onPress={performDissolve}>
                  <Text style={styles.submenuItemText}>Dissolve</Text>
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity style={styles.submenuItem} onPress={() => setProximitySubMenuVisible(!proximitySubMenuVisible)}>
              <CustomIcon name={proximitySubMenuVisible ? 'flow-cascade' : 'flow-branch'} size={20} color="black" onPress={() => {}} iconSet="Entypo" />
              <Text style={styles.submenuItemText}>Proximity Analysis</Text>
            </TouchableOpacity>
            {proximitySubMenuVisible && (
              <View style={styles.submenu}>
                <TouchableOpacity style={styles.submenuItem} onPress={openBufferDialog}>
                  <Text style={styles.submenuItemText}>Buffer</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submenuItem} onPress={performClip}>
                  <Text style={styles.submenuItemText}>Clip</Text>
                </TouchableOpacity>
               
              </View>
               
            )}
            <TouchableOpacity style={styles.submenuItem} onPress={() => setActiveMenuItem(null)}>
        <CustomIcon name="close" size={20} color="black" onPress={() => {}} iconSet="FontAwesome" />
        <Text style={styles.submenuItemText}>Close Generic Tools</Text>
      </TouchableOpacity>
          </View>
        )}
      </View>
      <Modal
        visible={bufferDialogVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.bufferDialog}>
            <TextInput
              style={styles.input}
              onChangeText={handleBufferSizeChange}
              value={bufferSize}
              placeholder="Buffer Size"
              keyboardType="numeric"
            />
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={bufferUnit}
                style={{ width: '100%' }}
                onValueChange={(itemValue, itemIndex) =>
                  handleBufferUnitChange(itemValue)
                }
              >
                <Picker.Item label="Metres" value="metres" />
                <Picker.Item label="Kilometres" value="kilometres" />
                <Picker.Item label="Miles" value="miles" />
              </Picker>
            </View>
            <View style={styles.buttonContainer}>
              <Button title="Cancel" onPress={closeBufferDialog} />
              <Button title="Apply" onPress={handlePerformBuffer} />
            </View>
          </View>
        </View>
      </Modal>
      <TouchableOpacity
          style={styles.userGuideContainer} // Adjust styling as needed
          onPress={navigateToStudyAreaComponent}
        >
         <CustomIcon name="book" size={20} color="black" onPress={() => {}} iconSet="Entypo" />
         <Text style={styles.userGuideText}>User Guide</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.datasetContainer} // Adjust styling as needed
          onPress={navigateToDataSetOverview}
        >
         <CustomIcon name="images" size={20} color="black" onPress={() => {}} iconSet="Entypo" />
         <Text style={styles.datasetText}>DataSets Overview</Text>
        </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 30,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  menu: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  menuItemText: {
    marginLeft: 10,
    fontSize: 15,
  },
  submenu: {
    marginLeft: 10,
    marginTop: 10,
  },
  submenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  submenuItemText: {
    marginLeft: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bufferDialog: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
    minWidth: 250,
  },
  input: {
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  pickerContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginBottom: 10,  
  },
  
  userGuideContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    marginTop: 'auto', // Pushes the User Guide to the bottom
  },
  userGuideText: {
    marginLeft: 10,
    fontSize: 15,
  },
  datasetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    marginTop: 'auto', // Pushes the User Guide to the bottom
  },
  datasetText: {
    marginLeft: 10,
    fontSize: 15,
  },
  tooltipText: {
    marginBottom: 10,
  },
  tooltipButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tooltipButton: {
    padding: 10,
    backgroundColor: 'lightgrey',
    borderRadius: 5,
  },
  touchableOpacity: {
    flex: 1,
  },

  tooltipContainer: {
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 5,
  },
});



export default Sidebar;
