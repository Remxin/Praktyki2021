import React, { useState, useRef, useContext, useEffect } from "react";
import "./AddOrder.css";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { Redirect } from "react-router-dom";
import { UserContext } from "../../contexts/UserContext";

import { db, firebaseStorage } from "../../firebase";
import { collection, addDoc } from "firebase/firestore";
import { getStorage, ref, getMetadata, getDownloadURL, uploadBytes } from "firebase/storage"

const AddOrder = () => {
  const { user, setUser } = useContext(UserContext);
  const ordersCollectionRef = collection(db, "orders");
  const [newOrderTitle, setNewOrderTitle] = useState("");
  const [newOrderContent, setNewOrderContent] = useState("");
  const [newOrderDate, setNewOrderDate] = useState("");
  const [newOrderTime, setNewOrderTime] = useState("");
  const [iAmNotARobot, setIAmNotARobot] = useState(false);
  const [url, setUrl] = useState("");
  const [orderDir, setOrderDir] = useState(0)
  const [images, setImages] = useState([])
  const imageRef = useRef(null)
  const imageUploadRef = useRef(null)
  const titleEl = useRef(null);
  const dateEl = useRef(null);
  const hourSelectEl = useRef(null);
  const descriptionEl = useRef(null);

  const storage = getStorage()
  // const storageRef = ref(storage, "images/serce.jpg")
  // const starsRef = storageRef.child('images/');


  // useEffect(() => {
  //   const hearthRef = ref(storage, 'images/serce-grafika.jpg')
  //   console.log(hearthRef)
  //   console.log(hearthRef)
  //   console.log(imageRef)
  //   getDownloadURL(hearthRef).then((urlArg) => {
  //     console.log(urlArg)
  //     imageRef.current.src = urlArg
  //   }).catch((err) => {
  //     console.log(err)
  //   })
  // }, [])

  useEffect(() => {
    console.log(imageUploadRef)
  }, [imageUploadRef.current])
  useEffect(() => {
    setUser(JSON.parse(localStorage.getItem("user")))
  }, [])

  const uploadImagesChange = async (e) => {
    console.log(e.target.files)
    setOrderDir(Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 15) + Math.round(Math.random() * 10000));
    console.log(orderDir)
    for (let i = 0; i < e.target.files.length; i++) {
      // setImages((prevState) => [...prevState, e.target.files[i]])
      await setImages([...images, e.target.files[i]])
    }
    console.log(images)
  }

  const uploadImagesOnClick = () => {

    images.forEach((image) => {
      let storageImageRef = ref(storage, `images/${orderDir}/${image.name}`)
      uploadBytes(storageImageRef, image).then((snapshot) => {
        console.log("file uploaded!")
      }).catch(err => console.log(err))

    })
  }

  const checkIfAllFieldsAreNotEmpty = () => {
    if (!newOrderTitle || !newOrderContent || !newOrderTime || !newOrderTime) {
      console.log("Fields must be no empty");
      document.querySelector(".form-errors").innerHTML =
        "<span class='form-error'>Fields must not be empty!</span>";
      return true;
    } else if (!iAmNotARobot) {
      document.querySelector(".form-errors").innerHTML =
        "<span class='form-error'>Confirm you are not a robot!</span>";
      return true;
    } else {
      document.querySelector(".form-errors").innerHTML =
        "<span class='form-success'>Success!</span>";
      return false;
    }
  };

  const createOrder = async (e) => {
    e.preventDefault();
    await checkIfAllFieldsAreNotEmpty();

    let isError = await checkIfAllFieldsAreNotEmpty();
    if (isError) {
      const orderDate = new Date(newOrderDate);
      var seconds = orderDate.getTime() / 1000;
      seconds = seconds - 7200;
    } else {
      console.log("success");
      sendConfirmationEmail()
      // ---- calculating time ----
      let hours = newOrderTime.substring(0, newOrderTime.indexOf(":"));
      let minutes = newOrderTime.substring(newOrderTime.indexOf(":") + 1);
      hours = hours * 3600;
      minutes = minutes * 60;

      const orderDate = new Date(newOrderDate);
      var seconds = orderDate.getTime() / 1000;
      seconds = seconds - 7200;

      // ---- adding time to the date value ----
      seconds = seconds + hours + minutes;
      // ---- uploading images to database ----
      await uploadImagesOnClick();
      // ---- sending new record to database ----
      await addDoc(ordersCollectionRef, {
        name: newOrderTitle,
        description: newOrderContent,
        date: seconds,
        status: "pending",
        clientId: user.id,
        workerId: "",
        imagesId: orderDir
      });
    }
  };


  // const buttonHandler = () => { };
  const sendConfirmationEmail = async () => {
    const body = {
      email: user.email,
      title: newOrderTitle,
      description: newOrderContent,
      date: newOrderDate,
      clientId: user.id
    };
    const data = await fetch("http://localhost:5000/confirmation-email", {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }).then((res) => res.json())
      .then((json) => console.log(json))
      .catch((err) => console.log(err));
  }
  if (true) {
    return (
      <div>
        <Form className="m-2 addOrder mt-5">
          <h1 className="page-title display-3">
            <strong>Add Order</strong>
          </h1>
          <br />
          <Form.Group className="mb-3" controlId="formBasicTitle">
            <Form.Label>Order title</Form.Label>
            <Form.Control
              ref={titleEl}
              type="text"
              placeholder="Enter order title"
              className="order-title"
              onChange={(e) => setNewOrderTitle(e.target.value)}
            />
            <Form.Text className="text-muted">Chose a wise one</Form.Text>
          </Form.Group>
          <Form.Control
            ref={dateEl}
            type="date"
            name="date_of_visit"
            className="order-date"
            onChange={(e) => setNewOrderDate(e.target.value)}
          />

          <select
            ref={hourSelectEl}
            className="time-select"
            className="order-time"
            onChange={async (e) => {
              setNewOrderTime(e.target.value);
            }}
          >
            <option>Choose hour</option>
            <option>8:00</option>
            <option>9:00</option>
            <option>10:00</option>
            <option>11:00</option>
            <option>12:00</option>
            <option>13:00</option>
            <option>14:00</option>
            <option>15:00</option>
            <option>16:00</option>
            <option>17:00</option>
          </select>
          <Form.Group className="mb-3" controlId="formControlTextarea">
            <Form.Label>Description</Form.Label>
            <Form.Control
              ref={descriptionEl}
              as="textarea"
              rows={3}
              className="order-content"
              onChange={(e) => setNewOrderContent(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="formBasicCheckbox">
            <Form.Check
              type="checkbox"
              label="I am not a robot"
              onClick={() => setIAmNotARobot(!iAmNotARobot)}
            />
          </Form.Group>
          {/* <Button variant="primary" onClick={(e) => e.preventDefault()}> */}
          <p className="form-errors"></p>
          <Button variant="primary" onClick={createOrder}>
            Submit
          </Button>
          {/* <img ref={imageRef}></img> */}
          <input id="upload-photo" type="file" name="upload-file" multiple ref={imageUploadRef} onChange={uploadImagesChange} />
        </Form>
      </div>
    );
  } else {
    return <Redirect to="/login" />;
  }
};

export default AddOrder;
