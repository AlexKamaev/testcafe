// const file = require('fs');
//
// const CDP = require('chrome-remote-interface');
//
// fixture`GH-1994 - The element that matches the specified selector is not visible`
//     .page`http://localhost:8080/`;
//
//
//
// test(`Recreate invisible element and click`, async t => {
//     const browserConnection = t.testRun.browserConnection;
//     const client            = browserConnection.provider.plugin.openedBrowsers[browserConnection.id].client;
//     const { Target } = client;
//
//
//
//     await t.openWindow('http://example.com');
//
//
//
//     const result = await Target.getTargets();
//
//     // console.log(result);
//     //
//     const initial = result.targetInfos.find(info => info.url.includes('http://localhost:8080'));
//     //
//     const target = result.targetInfos.find(info => info.url.includes('http://example.com'));
//
//
//
//
//     //
//     // console.log(target);
//     //
//     // debugger;
//
//     // await CDP.Activate(target);
//
//     // await new Promise(resolve => {
//     //     CDP.New((err, target) => {
//     //         if (!err) {
//     //             console.log(target);
//     //         };
//     //
//     //         console.log(err)
//     //         resolve();
//     //     });
//     // });
//     //
//
//
//     debugger;
//
//     const session = await Target.attachToTarget({ targetId: target.targetId, flatten: true });
//     const session2 = await Target.attachToTarget({ targetId: initial.targetId, flatten: true });
//     //
//     debugger;
//
//
//     // await Target.activateTarget({ targetId: target.targetId });
//
//
//
//
//     // const tar = await Target.createTarget({ url: 'http://google.com', newWindow: true  });
//     //
//     // debugger;
//     //
//     // const { Network, Page } = client;
//     //
//     //
//     //
//     // await t.openWindow('http://example.com');
//     //
//     // const session = await Target.attachToTarget({ targetId: target.targetId, flatten: true });
//     //
//     // console.log('****************');
//     // console.log(session);
//     //
//     // console.log(await Target.activateTarget({ targetId: target.targetId }));
//     //
//     //
//     // await Promise.all([
//     //     Network.enable(),
//     //     Page.enable()
//     // ]);
//     //
//
//     debugger
//
//     // const screenshotData = await Page.captureScreenshot({});
//     //
//     // // await Target.sendMessageToTarget({
//     // //     sessionId: session.sessionId,
//     // //     message:    'Page.captureScreenshot'
//     // // });
//     //
//     // debugger;
//     const res  = await client.send('Page.captureScreenshot', { format: 'png' }, null, session);
//     const res2 = await client.send('Page.captureScreenshot', { format: 'png' }, null, session2);
//
//
//     debugger;
//
//     file.writeFile('kekeke1.png', res.data, 'base64', function () {});
//     file.writeFile('kekeke2.png', res2.data, 'base64', function () {});
//
//     // file.writeFile('kekeke1.png', screenshotData.data, 'base64', function () {});
//
//     // const targets = await Target.getTargets();
//
//
//
//     // console.log(targets);
//     //
//     // debugger;
//
//     // targets[0].captureScreenshot({});
//
//
//
//
//     // await t.takeScreenshot('kekeke.png');
//
//     // await t.debug();
//
// });
//
//
// // test('test', async t => {
// //     const tab = await CDP.New();
// //
// //     const client = await CDP({ tab });
// //
// //     const { Page } = client;
// //
// //     await Page.enable();
// //     await Page.navigate({ url: 'http://example.com' });
// // });
