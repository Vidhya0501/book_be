import express from "express";
import mysql2 from "mysql2";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import cookieParser from "cookie-parser";
import dotenv from "dotenv"

dotenv.config()

const app = express();
app.use(cors(
  {
    origin:["http://localhost:5173"],
    methods: ["POST", "GET"],
    credentials: true
  }
));
app.use(express.json());
app.use(cookieParser())
const db = mysql2.createConnection({
  host: "localhost",
  user: "root",
  password: "Vidhyaviji@97",
  database: "bookdb",
});

const verifyUser = (req, res, next) =>{
  const token =res.cookie.token;
  if(!token){
    return res.json({Error: "Unauthorized access"});
  }
  else{
    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded)=>{
      if(err) {return res.json({Error: "Invalid Token"})}
      else{
        req.name = decoded.name;
        next();
      }
    })
  }
}
app.get("/", verifyUser, (req, res) => {
  return res.json({Status:"Success", name: req.name});
});

app.post("/register", (req, res)=>{
  const q = "INSERT INTO user (`name`, `email`, `password`) VALUES (?)" ;
  bcrypt.hash(req.body.password.toString(), process.env.SALT, (err, hash) =>{
    if(err) return res.json({Error: "Error in hasing password"});
    const values = [
      req.body.name,
      req.body.email,
      hash
     
    ];
    db.query(q, [values], (err, result) =>{
      if(err) return res.json({Error:"Error while insert data"});
      return res.json({Status:"Success"});
    })
  })
 
})

app.post("/login", (req, res)=>{
  const q="SELECT * FROM user WHERE email = ?";
  db.query(sql, [req.body.email], (err, data)=>{
    if(err) return res.json({Error:"Error while login"});
    if(data.length > 0){
      bcrypt.compare(req.body.password.toString(), data[0].password, (err, response)=>{
        if(err) return res.json({Error:"Password compare error"});
        if(response){
          const name = data[0].name
          const token = jwt.sign({name}, process.env.JWT_SECRET_KEY, {expiresIn:"1d"})
          res.cookie("token", token)
          return res.json({Status:"Success"});
        }
        else{
          return res.json({Error:"Password Incorrect"});
        }
      })
    }
    else{
      return res.json({Error:"Email doesn't exist"})
    }
  })
})

app.get("/books", (req, res) => {
  const q = "SELECT * FROM books";
  db.query(q, (err, data) => {
    if (err) {
      console.log(err);
      return res.json(err);
    }
    return res.json(data);
  });
});

app.post("/books", (req, res) => {
  const q = "INSERT INTO books(`title`, `desc`, `price`, `cover`) VALUES (?)";

  const values = [
    req.body.title,
    req.body.desc,
    req.body.price,
    req.body.cover,
  ];

  db.query(q, [values], (err, data) => {
    if (err) return res.send(err);
    return res.json(data);
  });
});

app.delete("/books/:id", (req, res) => {
  const bookId = req.params.id;
  const q = " DELETE FROM books WHERE id = ? ";

  db.query(q, [bookId], (err, data) => {
    if (err) return res.send(err);
    return res.json(data);
  });
});

app.put("/books/:id", (req, res) => {
  const bookId = req.params.id;
  const q = "UPDATE books SET `title`= ?, `desc`= ?, `price`= ?, `cover`= ? WHERE id = ?";

  const values = [
    req.body.title,
    req.body.desc,
    req.body.price,
    req.body.cover,
  ];

  db.query(q, [...values,bookId], (err, data) => {
    if (err) return res.send(err);
    return res.json(data);
  });
});

app.get("/logout", (req, res) =>{
  res.clearCookie("token");
  return res.json({Status:"Success"});
})
app.listen(8800, () => {
  console.log("Connected to backend.");
});