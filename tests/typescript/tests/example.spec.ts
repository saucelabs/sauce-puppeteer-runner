describe('saucectl demo test', () => {
    test('verify ts is transpiling', async function () {
        // Just transpile a typescript variable to confirm that it's transpiling typescript
        const str:String = "Hello World";
        console.log(str);
    });
});