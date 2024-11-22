const express = require('express')
const app = express()
const path = require('path')
const mongoose = require('mongoose')
const ObjectID = require('mongoose').Types.ObjectId
const methodOverride = require('method-override')
const AppError = require('./AppError')

const Product = require('./models/product')

mongoose.connect('mongodb://127.0.0.1:27017/farmas')
    .then(()=> {
        console.log("MONGO Connection Open!")
    })
    .catch(err => {
        console.log("Oh No MONGO CONNECTION Error!")
        console.log(err)
    })

const productSchema = new mongoose.Schema({
    name: String,
    price: Number,
    isAvailable: Boolean
})

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.use(express.urlencoded({extended: true}))
app.use(methodOverride('_method'))


const categories = ['fruit', 'vegetable', 'dairy']

function wrapAsync(fn){
    return function(req,res,next){
        fn(req,res,next).catch(e => next(e))
    }
}

//Weird that it accept any category name & renders a page for it//
app.get('/products', wrapAsync(async (req,res,next) =>{
    const {category} = req.query
    if (category) {
        const products = await Product.find({category})
        res.render('products/index', {products, category})
    }else{
    const products = await Product.find({})
    res.render('products/index', {products, category : 'All'})
    }
}))

app.get('/products/new', (req,res) => {
    res.render('products/new', {categories})
})

app.post('/products', wrapAsync(async (req,res,next) => {
    const newProduct = new Product(req.body)
    await newProduct.save()
    res.redirect(`/products/${newProduct._id}`) 
}))

app.get('/products/:id', wrapAsync(async (req,res,next) =>{
    const {id} = req.params
    //Commented out to test the error handler at the bottom and to see
    //the actual name of error (cast error)//
    // if(!ObjectID.isValid(id)){
    //     throw new AppError('Invalid Product ID', 404)
    // }
    const product = await Product.findById(id)
    if(!product){
        throw new AppError('Product Not Found', 404)
    }
    res.render('products/show', {product})
}))

app.get('/products/:id/edit', wrapAsync(async (req,res,next) =>{
    const {id} = req.params
    // if(!ObjectID.isValid(id)){
    //     throw new AppError('Invalid Product ID', 404)
    // }
    const product = await Product.findById(id)
    if(!product){
        throw new AppError('Product Not Found', 404)
    }
    res.render('products/edit', {product, categories})  
}))

app.put('/products/:id', wrapAsync(async (req, res,next) =>{
    const {id} = req.params
    const product = await Product.findByIdAndUpdate(id, req.body, {new: true, runValidators: true})
    res.redirect(`/products/${product._id}`)
}))

app.delete('/products/:id', wrapAsync(async (req, res) =>{
    const {id} = req.params
    const deletedProduct = await Product.findByIdAndDelete(id)
    res.redirect('/products')
}))

//Example on handling different errors by name here we only do Validation Errors //
//************************************//
const handleValidationErr = err => {
    return new AppError('Validation Failed, Please enter all required fields', 400)
}

app.use((err,req,res,next) =>{
    console.log(err.name)
    if(err.name === 'ValidationError') err = handleValidationErr(err)
    next(err)
})
//***************************************** */


//All the errors passed to 'next(err)' go here for error handling//
//fyi, err is the name of the error that is passed to next(*here*)//
app.use((err,req,res,next) =>{
    const {status = 500, message = 'Something Went Wrong'} = err
    res.status(status).send(message)
})

app.listen(3000, () =>{
    console.log("LISTENING ON PORT 3000!")
})