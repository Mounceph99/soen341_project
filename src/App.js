import React, { useState } from "react";
import "./App.css";

import { BrowserRouter as Router, Route } from "react-router-dom"; // [npm i react-router-dom]
import CommentDrawer from "./components/commentDrawer";
import PostList from "./components/Post/PostList";
import Post from "./components/Post/Post";
import Header from "./components/Header";
import User from "./components/User/User";
import UtilityFloat from "./components/UtilityFloat";

// import PostModal from "./components/Modal/PostModal";
import NewPostModal from "./components/Modal/NewPostModal";
import CommentList from "./components/CommentList";
import Comment from "./components/Comment";

var user; // TODO initialize from login

function App() {

  /* 
   * DATA STATE
   */

  const [user] = useState([
    {  UID: 1, userName: "Jack" },
    { UID: 2, userName: "Rose" }
  ])

  const [posts, setPosts] = useState([
    { userName: "user1", picture: "pic1", date: "2019-01-01", comments: ["wow", "nice"] },
    { userName: "user1", picture: "pic1", date: "2019-01-02", comments: null },
    { userName: "user1", picture: "pic1", date: "2019-01-03", comments: null }
  ]);

  const [openCommentDisplay, setOpenCommentDisplay] = useState(false);


  /* 
   * COMPONENT STATE 
   */

  /* modal toogle */
  const [openNewPostModal, setOpenNewPostModal] = useState(false);   
  /* uploaded file */
  const [file, setFile] = useState(null);


  /* FUNCTION */
  const renderPosts = () => {
    return posts.map((post, index) => {
      return <Post post={post} key={index}></Post>;
    });
  };

  const handleOpenNewPostModal = e => {
    setOpenNewPostModal(true);
  };

  const handleCloseNewPostModal = e => {
    setOpenNewPostModal(false);
  }; 

  const addPosts = () => { 
    console.log("App.addPosts()")  
    console.log(file)
    /* converte image to base64 format */
    var img = new Image();
    img.src = file;
    img.crossOrigin = 'Anonymous'; 
    var canvas = document.createElement('canvas'),
      ctx = canvas.getContext('2d'); 
    canvas.height = img.naturalHeight;
    canvas.width = img.naturalWidth;
    ctx.drawImage(img, 0, 0); 
    var b64 = canvas.toDataURL('image/png').replace(/^data:image.+;base64,/, '');
    console.log("b64")
    console.log(b64)  
    /* update post */
    const newPost = {userName: "newUser", picture: b64, date: "2020-01-01", comments: null}
    setPosts([newPost, ...posts])
    handleCloseNewPostModal()
  }
 
  // const handleChange = (e) => {
  //   console.log("handleChange()") 
  //   console.log(URL.createObjectURL(e.target.files[0]))
  //   setFile(URL.createObjectURL(e.target.files[0]))  
  // } 
 

  const follow = () =>{

  }

  return (
    <Router>
      <div className="App">
        <div className="Header">
          <Header></Header>
        </div>
        <div className="MainWrapper" style={{backgroundColor:'#eeeeee'}}>
 

        {/* <div className="test" style={{border: "1px gray solid"}}>
          <input type="file" id="imageFile" name="imageFile" onChange={handleChange}></input>  
          <div style={{hidden:"true"}}>Image preview: <div><img style={{width:"50px"}} src={file}></img></div></div>
          <div><button onClick={e => addPosts()}>POST</button></div>
        </div> */}
 

        <div className="PostWrapper" >
          <PostList renderPosts={renderPosts}></PostList>
        </div>  
        </div>
        <div className="FloatButton" onClick={e => handleOpenNewPostModal()}>
          <UtilityFloat></UtilityFloat>
        </div>
        <div className="CommentDrawer">
          <CommentDrawer ></CommentDrawer>

        </div>



        <div className="Modal">
          <div className="NewPostModal">
            <NewPostModal
              open={openNewPostModal}
              handleCloseNewPostModal={handleCloseNewPostModal}
              addPosts={addPosts}
              setFile={setFile}
              setPosts={setPosts}
              posts={posts}
            />
          </div>
          <div className="PostModal"></div>
        </div>
      </div>
    </Router>
  );
}

export default App;
