exports.get404 = (req,res)=>{
    // res.status(404).sendFile(path.join(__dirname,'views', '404.html'));
    res.status(404).render("404",{title:'page not found',path:"/404", isAuthenticated: req.isLoggedIn});
}
exports.get500 = (req,res)=>{
    // res.status(404).sendFile(path.join(__dirname,'views', '404.html'));
    res.status(500).render("500",{title:'Error!', path:"/500", isAuthenticated: req.isLoggedIn});
}