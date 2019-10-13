import React from "react";
import {
  ActivityIndicator,
  Clipboard,
  FlatList,
  Image,
  Share,
  StyleSheet,
  AsyncStorage,
  Text,
  ScrollView,
  View,
  RefreshControl,
  Alert
} from "react-native";
import { Icon, Header, ListItem, Button } from "react-native-elements";
import * as ImagePicker from "expo-image-picker";
import * as Permissions from "expo-permissions";
import uuid from "uuid";
import Environment from "../config/environment";
import firebase from "../config/firebase";
import Swipeout from "react-native-swipeout";
import OptionsMenu from "react-native-options-menu";

export default class ListScreen extends React.Component {
  state = {
    items: [],
    refreshing: false
  };

  static navigationOptions = ({ navigation }) => {
    const icon = (<Icon name="plus" type="antdesign" size={24} />);
    return {
      header: (
        <Header
          centerComponent={
            <Image
              source={require("../assets/icon.png")}
              style={{ width: 40, height: 40, resizeMode: "contain" }}
            />
          }
          rightComponent={
            <OptionsMenu
              customButton={icon}
              destructiveIndex={1}
              options={["Choose From Library", "Take a Picture", "Cancel"]}
              actions={[()=>navigation.state.params.pick(), ()=>navigation.state.params.cam()]}
            />
          }
          backgroundColor="#38B6FF"
        />
      )
    };
  };

  async componentDidMount() {
    this.props.navigation.setParams({cam: this._takePhoto.bind(this),pick: this._pickImage.bind(this)});
    await Permissions.askAsync(Permissions.CAMERA_ROLL);
    await Permissions.askAsync(Permissions.CAMERA);
    await AsyncStorage.getItem("userToken").then(token => {
      this.setState({ uniq: token.substring(0, token.indexOf("*")),
        name: token.substring(token.indexOf("*") + 1) });
    });
    this.getData();
  }

  _maybeRenderUploadingOverlay = () => {
    if (this.state.uploading) {
      return (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: "rgba(0,0,0,0.4)",
              alignItems: "center",
              justifyContent: "center"
            }
          ]}
        >
          <ActivityIndicator color="#fff" animating size="large" />
        </View>
      );
    }
  };

  async getData() {
    this.setState({refreshing: true});
      //console.log(token);
    var ref = firebase.database().ref();
    ref.child("/users/").once("value").then((snapshot)=> {
        if (!snapshot.hasChild(this.state.uniq)) {
          ref
            .child("users/" + this.state.uniq)
            .set({
              items: [],
              name: name
            });
        }
    });

    ref
    .child("/users/" + this.state.uniq + "/items/")
    .once("value")
    .then(snapshot =>
      //console.log(vals);
      {
        if(snapshot.exists()){
          this.setState({
            items: snapshot.val(),
            refreshing: false
          });}
        else{
            this.setState({refreshing: false});
        }
      }
    );
  }

  async deleteMember(item) {
    var key = "";

    await firebase
      .database()
      .ref()
      .child("/user/" + this.state.uniq + "/items/")
      .once("value")
      .then(function(snapshot) {
        snapshot.forEach(function(data) {
          var temp = data.val();
          console.log(temp);
          if (temp.name == item.name) {
            key = data.key;
            return;
          }
        });
      });

    await firebase
      .database()
      .ref()
      .child("/users/" + this.state.uniq + "/items/" + key)
      .remove();

    this.setState(state => {
      state.items = state.items.filter(i => item.name != i.name);
      return state;
    });
  }

  _takePhoto = async () => {
    let pickerResult = await ImagePicker.launchCameraAsync({
      allowsEditing: true
      //aspect: [4, 3]
    });

    this._handleImagePicked(pickerResult);
  };

  _pickImage = async () => {
    let pickerResult = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true
      //aspect: [4, 3]
    });

    this._handleImagePicked(pickerResult);
  };

  _handleImagePicked = async pickerResult => {
    try {
      this.setState({ uploading: true });

      if (!pickerResult.cancelled) {
        uploadUrl = await this.uploadImageAsync(pickerResult.uri);
        this.setState({ image: uploadUrl });
        this.submitToGoogle();
      }
    } catch (e) {
      console.log(e);
      alert("Upload failed, sorry :(");
    } finally {
      this.setState({ uploading: false });
    }
  };

  uploadToFirebase() {
    firebase
      .database()
      .ref("/users/" + this.state.uniq + "/items/")
      .set(this.state.items);
    this.setState({ uploading: false });
    alert("Success!");
  }

  submitToGoogle = async () => {
    try {
      this.setState({ uploading: true });
      let { image } = this.state;
      let body = JSON.stringify({
        requests: [
          {
            features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
            image: {
              source: {
                imageUri: image
              }
            }
          }
        ]
      });
      let response = await fetch(
        "https://vision.googleapis.com/v1/images:annotate?key=" +
          Environment["GOOGLE_CLOUD_VISION_API_KEY"],
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json"
          },
          method: "POST",
          body: body
        }
      );
      let responseJson = await response.json();

      this.setState({
        response: responseJson.responses[0].fullTextAnnotation
      });

      var text = [];
      var items = [],
        index = 0;
      var r = responseJson.responses[0].fullTextAnnotation.pages;
      console.log("lol");
      var start = false,
        end = false;
      var last_word = null,
        total = 0,
        item_x = null,
        price_x = null;
      var item = "",
        price = "";

      for (var page in r) {
        for (var block in r[page].blocks) {
          for (var paragraph in r[page].blocks[block].paragraphs) {
            for (var word in r[page].blocks[block].paragraphs[paragraph]
              .words) {
              var w = r[page].blocks[block].paragraphs[paragraph].words[word];

              var temp = "";
              for (var c in w.symbols) {
                temp += w.symbols[c].text;
              }
              //console.log(temp);
              w.text = temp;
              text.push(w);
              // if(w['property']['detectedBreak']['type']=='SURE_SPACE'){

              //    console.log(temp);
              //    text.push(temp);
              // }
            }
          }
        }
      }

      text.sort((a, b) => {
        if (
          Math.abs(a.boundingBox.vertices[0].y - b.boundingBox.vertices[0].y) >
          12.5
        ) {
          return a.boundingBox.vertices[0].y > b.boundingBox.vertices[0].y;
        } else {
          return a.boundingBox.vertices[0].x > b.boundingBox.vertices[0].x;
        }
      });

      for (var i in text) {
        var temp = text[i].text;
        // console.log(temp);
        // console.log(text[i].boundingBox.vertices[0].x);
        // console.log(text[i].boundingBox.vertices[0].y);
        // console.log("---------");
        if (temp == "GROCERY") {
          start = true;
          continue;
        }
        if (start) {
          if (temp == "TOTAL") {
            //console.log(items);
            this.setState({ items: items });
            this.uploadToFirebase();
            return;
          }
          var tX = text[i].boundingBox.vertices[0].x;
          if (isNaN(temp)) {
            if (item_x == null) {
              item_x = tX;
              item +=
                temp.charAt(0).toUpperCase() +
                temp.toLowerCase().substring(1) +
                " ";
            } else {
              if (
                temp.length > 1 &&
                (Math.abs(tX - item_x) < 20 || tX > item_x - 10) &&
                temp == temp.toUpperCase()
              )
                item +=
                  temp.charAt(0).toUpperCase() +
                  temp.toLowerCase().substring(1) +
                  " ";
              if (temp == "N" || temp == "F") {
                if (price != "") {
                  console.log(price);
                  items[index]["price"] = price;
                  price = "";
                  index++;
                }
              }
              if (temp == "." && tX > price_x) {
                price += ".";
              }
            }
          } else {
            if (item_x != null) {
                //&& Math.abs(price_x - 2*item_x) < 15
              if (item != "") {
                console.log(item);
                items.push({ name: item });
                item = "";
              }
              if (price_x == null) {
                price_x = tX;
                price += temp;
              } else {
                if (
                  (tX > price_x || Math.abs(tX - price_x) < 15) &&
                  temp.length < 5
                )
                  price += temp;
              }
            }
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  async uploadImageAsync(uri) {
    const blob = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function() {
        resolve(xhr.response);
      };
      xhr.onerror = function(e) {
        console.log(e);
        reject(new TypeError("Network request failed"));
      };
      xhr.responseType = "blob";
      xhr.open("GET", uri, true);
      xhr.send(null);
    });

    const ref = firebase
      .storage()
      .ref()
      .child(uuid.v4());
    const snapshot = await ref.put(blob);

    blob.close();

    return await snapshot.ref.getDownloadURL();
  }

  action(item) {
    var alert = "Remove Member";
    var title = "Are you sure you want remove " + item.name + "?";

    Alert.alert(title, alert, [
      { text: "Cancel" },
      {
        text: "Yes",
        onPress: () => {
          this.deleteMember(item);
        }
      }
    ]);
  }

  renderRow(item, index) {
    let swipe = [
      {
        text: "-",
        backgroundColor: "red",
        onPress: () => {
          this.action(item, "delete");
        }
      }
    ];
    return (
      <Swipeout
        key={index}
        right={swipe}
        autoClose={true}
        backgroundColor="transparent"
      >
        <ListItem
          key={index}
          title={item.name}
          rightTitle={item.price}
          bottomDivider
        />
      </Swipeout>
    );
  }

  _renderlist() {
    if (this.state.items == null || this.state.items.length == 0) {
      return (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={styles.t}>Wow, so empty!</Text>
        </View>
      );
    } else {
      return (
        this.state.items && (
          <FlatList
            style={{marginTop: 10}}
            data={this.state.items}
            ListHeaderComponent={
                <Text style={styles.welcome}>
                    Welcome {this.state.name.substring(0, this.state.name.indexOf(" "))}!
                </Text>
            }
            renderItem={({ item, index }) => this.renderRow(item, index)}
            keyExtractor={item => item.name}
          />
        )
      );
    }
  }

  _gettotal() {
    var total = 0;
    for (var i in this.state.items) {
      total += parseFloat(this.state.items[i].price);
    }
    return (
      <ListItem
        title="Total"
        rightTitle={total.toString()}
        containerStyle={styles.total}
      />
    );
  }
  render() {
    return (
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={this.state.refreshing}
            onRefresh={this.getData.bind(this)}
          />
        }
      >
        {this.state.name && this._renderlist()}
        {this.state.items && this.state.items.length > 0 && this._gettotal()}
        {this._maybeRenderUploadingOverlay()}
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    marginLeft: 15,
    marginRight: 15
  },
  welcome: {
    textAlign: "center",
    fontSize: 22
  },
  t: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 36,
    fontSize: 36
  },
  total: {
    backgroundColor: "#D3D3D3"
  }
});
