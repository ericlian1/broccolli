import React from "react";
import {
  ActivityIndicator,
  Button,
  Clipboard,
  FlatList,
  Image,
  Share,
  StyleSheet,
  AsyncStorage,
  Text,
  ScrollView,
  View,
  RefreshControl
} from "react-native";
import { Header, ListItem } from "react-native-elements";
import firebase from "../config/firebase";
import Swipeout from "react-native-swipeout";

export default class ListScreen extends React.Component {
    state={
        items: [],
        refreshing: false
    };


  static navigationOptions = ({ navigation }) => {
    return {
      header: (
        <Header
          centerComponent={
            <Image
              source={require("../assets/icon.png")}
              style={{ width: 40, height: 40, resizeMode: "contain" }}
            />
          }
          backgroundColor="#38B6FF"
        />
      )
    };
  };

  componentDidMount() {
    this.getData();
  }

  getData() {
    AsyncStorage.getItem("userToken").then((token) => {
      var ref = firebase.database().ref();
      var uniq = token.substring(0, token.indexOf("*"));
      var name = token.substring(token.indexOf("*") + 1);
      //console.log(token);

      ref.child("/users/").once("value", function(snapshot) {
        if (!snapshot.hasChild(uniq)) {
          firebase
            .database()
            .ref("users/" + uniq)
            .set({
              items: [],
              name: name
            });
        }
      });

      var reads = [];

    return ref
        .child("/users/" + uniq + "/items/")
        .once("value").then((snapshot) =>
          //console.log(vals);
          {snapshot.exists() &&
            this.setState({
                items: snapshot.val(),
                name: name
            })
        });
    });
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
          temp = temp.substring(0, temp.indexOf("*"));
          if (temp == item.uniq) {
            key = data.key;
            return;
          }
        });
      });

    await firebase
      .database()
      .ref()
      .child("/clubs/" + club + "/members/" + key)
      .remove();

    await firebase
      .database()
      .ref()
      .child("/users/" + item.uniq + "/clubs/")
      .once("value")
      .then(function(snapshot) {
        snapshot.forEach(function(data) {
          var temp = data.val();
          if (club == temp) {
            key == data.key;
            return;
          }
        });
      });
    await firebase
      .database()
      .ref()
      .child("/users/" + item.uniq + "/clubs/" + key)
      .remove();
    Alert.alert("Success", "Successfully removed " + n + " from this club", [
      { text: "Ok" }
    ]);
    this.setState(state => {
      state.members = state.members.filter(i => item != i);
      return state;
    });
  }

    action(item){
        var alert = "";
        var title = "";
        const n = this.state.user_uniq == item.uniq ? "yourself" : item.name;

        if (type == "delete") {
          title = "Remove Member";
          alert = "Are you sure you want remove " + n + "?";
        } else if (type == "add") {
          title = "Promote Member";
          alert = "Are you sure you add another " + n + "?";
        }

        Alert.alert(title, alert, [
          { text: "Cancel" },
          {
            text: "Yes",
            onPress: () => {
              if (type == "delete") this.deleteMember(item);
              else if (type == "add") this.promoteMember(item);
            }
          }
        ]);
    }
    renderRow(item) {
        let swipe = [
          {
            text: "-",
            backgroundColor: "red",
            onPress: () => {
              this.action(item,"delete");
            }
          },
            {
            text: "+",
            backgroundColor: "blue",
            onPress: () => {
              this.action(item,"add");
            }
          },
        ];
        return (
          <Swipeout
            key={item.name}
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

  _renderlist(){
    if (this.state.items == null || this.state.items.length == 0){
        return <Text style={styles.t}>Wow, so empty!</Text>;
    }else{
        return this.state.items && <FlatList
            data={this.state.items}
            renderItem={
                ({item,index})=>this.renderRow(item)}
            keyExtractor={item => item.name}
            />;
    }
  }

  render() {
    return (
      <ScrollView contentContainerStyle={styles.container} refreshControl={
            <RefreshControl
              refreshing={this.state.refreshing}
              onRefresh={this.getData}
            />
      }>
        {this.state.name && 
            <Text>Welcome {this.state.name.substring(0,this.state.name.indexOf(' '))}</Text>}
        {this._renderlist()}
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
  t:{
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 36
  }
});
