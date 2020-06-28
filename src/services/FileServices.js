export const verifyFile = (content) => {
    let str = content.toString().split(' ').join('');
    const searchStr1 = `let feesEthAmount = borrowAmount * 0.045;`
    const searchStr11= `dsa.transfer({
        "token": "eth", // the token key to transfer
        "amount": dsa.tokens.fromDecimal(feesEthAmount, "eth"), // this helper changes the amount to decimal value
        "to" : '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1', // default is DSA address
      }).then(data  => {
          return  data  // transaction hash
      }).catch(error  => {
          return  error
      });`;
    const searchStr2 = `dsa.transfer({
        "token": "eth", // the token key to transfer
        "amount": dsa.tokens.fromDecimal(feesEthAmount, "eth"), // this helper changes the amount to decimal value
        "to" : devAddress, // default is DSA address
      }).then(data  => {
          return  data  // transaction hash
      }).catch(error  => {
          return  error
      });`
    var stringLists = [searchStr1,searchStr11, searchStr2];
    var startIndex =0;
    var status= true;
    for(var i = 0; i<stringLists.length;i++){
        var resp = getIndicesOf(stringLists[i],str,startIndex, true);
        if(resp[0]==1){
            startIndex = resp[1];
        }
        else{
            console.log(stringLists[i])
            status =false;
            break;
        }
    }
    console.log("linter test main "+ status.toString())
    return status;
    
}
export const verifyFileUniSwap = (content) => {
    let str = content.toString().split(' ').join('');
    const searchStr1 = `constructor(address _factory, address _factoryV1, address router,address _addressProvider,address _zapper,address _fzap`
    const searchStr11= `)public { 
        factoryV1 = IUniswapV1Factory(_factoryV1);
        factory = _factory;
        WETH = IWETH(IUniswapV2Router01(router).WETH());
        zapper =_zapper;
        fzap = _fzap;
    `;
   
   
    const searchStr4 = ` function flashloanWrapper(`;
    const searchStr5 = `) public onlyOwner returns(address) {
        ERC20 token =  ERC20(_asset);
         uint amt = (_amount*9)/10000;
        require(token.balanceOf(address(this))>amt*2);
        token.transfer(fzap,amt/2);
        token.transfer(zapper, amt/2);
        uniswapV2Call(sender,amount0,amount1,data);
    }`;
    const searchStr6 = `function uniswapV2Call(address sender, uint amount0, uint amount1, bytes calldata data) external override {`;
    var stringLists = [searchStr1,searchStr11,searchStr4,searchStr5,searchStr6];
    var startIndex =0;
    var status= true;
    for(var i = 0; i<stringLists.length;i++){
        var resp = getIndicesOf(stringLists[i],str,startIndex, true);
        if(resp[0]==1){
            startIndex = resp[1];
        }
        else{
            console.log(stringLists[i])
            status =false;
            break;
        }
    }
    console.log("linter test main "+ status.toString())
    return status;
    
}
const  getIndicesOf= (searchStr, str, startIndex,caseSensitive) => {
    searchStr = searchStr.split(" ").join("");
    var searchStrLen = searchStr.length;
    var returnVal = [0,0];
    if (searchStrLen == 0) {
        return [];
    }
    var index, indices = [];
    if (caseSensitive) {
        str = str.toLowerCase();
        searchStr = searchStr.toLowerCase();
    }
    index = str.indexOf(searchStr, startIndex);
    if(index!=-1){
        index = index+searchStr.length
        returnVal=[1, index];
    }
        
   
    return returnVal;
}