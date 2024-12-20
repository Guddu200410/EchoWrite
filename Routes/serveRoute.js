const express = require('express');
const {
    loginUser,
    signin,
    forgotPassword,
    showResetPasswordPage,
    updatePassword
} = require('../Controllers/userController');
const uploader = require('../Middlewares/multerMiddleware');
const userAuth = require('../Middlewares/userAuthenticationMiddleware');
const customerSupport = require('../Controllers/customerSupportController');
const getProfileInformation = require('../Controllers/profileController');
const { uploadPost, getPostById, postComments } = require('../Controllers/postController');
const { getAllPost } = require('../Controllers/getAllPostController');
const getUserById = require('../Controllers/getUserByIdController');
const router = express.Router();

/**
 * @swagger
 * /:
 *  get:
 *      summary: Home page
 *      description: This is home page route
 *      responses:
 *          200:
 *              description: A list of sample Home page
 */
router.get('/', userAuth('usertoken'), (req, res) => {
    res.render('homePage');
});

router.get('/signup', (req, res) => {
    res.render('signupPage');
});

router.get('/login', (req, res) => {
    res.render('loginPage');
});

router.get('/logout', userAuth('usertoken'), (req, res) => {
    res.clearCookie('usertoken').redirect('/');
});

router.get('/forgotpassword', (req, res) => {
    res.render('forgotPasswordPage');
});

router.get('/checkMail', (req, res) => {
    res.render('checkYourMailPage', { mailName: req.body.email });
});

router.get('/resetpassword/:token', showResetPasswordPage);

router.post('/user/login', loginUser);
router.post('/user/signup', uploader.single("profileimage"), signin);
router.post('/user/forgotPassword', forgotPassword);
router.post('/updatePassword', updatePassword);

router.get('/user/post', userAuth('usertoken'), (req, res) => res.render('postPage'));
router.get('/user/profile', userAuth('usertoken'), (req, res) => res.render('profilePage'));
router.get('/user/getuserById/:authorId', userAuth('usertoken'), getUserById);
router.get('/user/profile/update',userAuth('usertoken'), (req, res)=>{
    res.render('editProfilePage');
});
router.get('/user/profileinfo/:token', getProfileInformation);
// router.get('/user/profileinfo', getProfileInformation);
router.get('/user/customersupport', userAuth('usertoken'), (req, res) => res.render('supportPage'));

router.post('/user/support', customerSupport);
router.post('/user/post', uploader.single('postimage'), uploadPost);

router.get('/user/getAllPost', userAuth('usertoken'), getAllPost);

router.get('/post/:postId', userAuth('usertoken'), getPostById);
router.post('/post/comment', userAuth('usertoken'), postComments);
module.exports = router;