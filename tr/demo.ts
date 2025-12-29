const Clicks = (clicks: number[]) => {
clicks.forEach((click,index) => {
    const floor = click;
    console.log(floor,index);
})
}
const clicks=[5,7,8,2,3,4];
Clicks(clicks);

// 5,3,2,1,4