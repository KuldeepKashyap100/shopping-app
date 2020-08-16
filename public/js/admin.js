const deleteProduct = (btn) => {
    const productId = btn.parentNode.querySelector('[name="id"]').value;
    const csrfToken = btn.parentNode.querySelector('[name="_csrf"]').value;
    const product = btn.closest('article');

    fetch('/admin/product/'+productId, {
        method: 'DELETE',
        headers: {
            'csrf-token': csrfToken
        }
    })
    .then(result=>result.json())
    .then(result=>{
        // but it does not work on ie
        // product.remove();
        product.parentNode.removeChild(product);
        console.log(result);
    })
    .catch(err=>{
        console.log(err);
    })
};