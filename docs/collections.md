# Collections
Collections are a simple way to integrate a real-time database into your application. A collection contains `json` documents and is kept in-sync with all clients subscribing to it. The client can directly manipulate the data, but the backend is the gatekeeper for access management and can check the validity of the documents.

## Setting up a collection
The collections are defined in the startup code of your app as a chained call to your amber initialization (see [config](docs/config.md)).
```ts
// server side code
amber().withPath("/amber")
// some other amber initialization
.withCollection<MyEntity>(
    "my-data"
        // other options for this collection can be added here as well
    })
    // continue with amber initialization
```
The details of the options can be found in the [CollectionSettings](api/backend/interfaces/CollectionSettings.md) documentation. 

On the client side, the counterpart to get the collection data is equally simple:
```ts
// client side code
 var client = amberClient().withPath("/amber").withAmberUiLogin().start(); // prepare client and start the login process
 var user = await client.userInTenant(); // wait until the user is logged in
 var collectionsApi = client.getCollectionsApi();
 var myDataCollection = collectionsApi.getCollection<MyEntity>("my-data");
 var myData: {entity:MyEntity, id:string}[] = [];
 myDataCollection.subscribe(0, 
 (newOrUpdated)=>{ // handle new or updated records
    const existing = myData.findIndex((e) => e.id === newOrUpdated.id);
    if (existing) existing.entity = newOrUpdated.data;
    else myData.push({entity:newOrUpdated.data, id:newOrUpdated.id});
 }, 
 (deletedId)=>{ // handle removed records
    const index = myData.findIndex((d) => d.id === deletedId);
    if (index !== -1) {
        todos.value.splice(index, 1);
    }
 });
 collectionsApi.connect(); // start the synchronization
```

## Create, update and delete documents

### From the browser client
Creating a new document from the client code is very straight forward:
```ts
// client side code
 const createdDocId = await myDataCollection.createDoc({ /* some data */});
```
This is an asynchronous call and completes AFTER the synchronization has already been done. You do not need to put the record locally into your in-memory-cache (in this example the `myData` array), it is done via the synchronization that has been set-up in the `subscribe` method.
You can immediately use the returned `id` to find the document in your cache to e.g. highlight it in your frontend.

Changing the document is an easy task from the client side as well. We only need to know the `id` and the `change_number` of the document that we want to update. The `change_number` is a reference to the (ever increasing) version of the collection in which the document has been changed. It is necessary to avoid race-conditions and unintended overrides from parallel action in multiple clients. The first step is to store the `change_number` in our in-memory array:
```ts
// client side code
var myData: {entity:MyEntity, id:string, changeNumber:number}[] = [];
//..
    if (existing) {
        existing.entity = newOrUpdated.data; 
        existing.changeNumber = newOrUpdated.change_number;
    }
    else myData.push({entity:newOrUpdated.data, id:newOrUpdated.id, changeNumber:newOrUpdated.change_number});
//..
```

Now we can change one entry in the following way:
```ts
// client side code
var theOneToChange = myData[42];
try{
    myDataCollection.updateDoc(
        theOneToChange.id,
        theOneToChange.changeNumber,
        {
            someData:theOneToChange.entity.someData,
            changedValue: theOneToChange.entity.changedValue + 1
        }
    );
}
catch(e:ServerError){
    console.log("Something went wrong. Maybe someone was faster");
}
```
And finally the deletion:
```ts
// client side code
var theOneToDelete = myData[42];
try {
    await myDataCollection.deleteDoc(
    theOneToDelete.id
    );
} 
catch (error) {
    console.error("Error deleting entry:", error);
}
//..
```
### Server side
Even though `Amberbase` encourages to use the two-tier model where the logic resides on the client, it enables you to create server side logic for more complex or more sensitive scenarios.
You can use the `Amber` instance for accessing the necessary API (see [documentation](api/backend/classes/Amber.md)).

```ts
// server side code
let amberApp = await amberInit.create(app); 

app.post('/:tenant/data/:id',async (req, res) => {
    var session = await amberApp.auth.getSessionToken(req);
    if(session.roles.includes("editor"))
    {
        amberApp.collections.getCollection<MyEntity>("my-data")!.deleteDocument(req.params.id);
    }
    //..
})
```
For all methods to work with the collections from the server side, please have a look [here](docs/api/backend/interfaces/AmberCollection.md);

## Validation
Having a two tier application is great for simplicity, but it is often necessary to at least check if some data manipulation does not violate verification or integrity guarantees. To do that, you can add a validation callback to your collection definition that returns `false` if the change should not go through.

```ts
 // server side code
 amber().withCollection<MyEntity>("my-data",
    
    validator:(user, oldDoc, newDoc, action) => {
        if (action == 'create' || action == 'update') // action could also be 'delete'
        {
            if (newDoc.title.length < 3) return false; // title must be at least 3 characters long. 
        }
        return true;
    }
}
```

The `user` presents the current user issuing the change. The `oldDoc` and `newDoc` are available when they make sense (`oldDoc` is empty on `create`, `newDoc` is empty on `delete`...). The `action` is one of `create`, `update` or `delete`.

## Post change processing
In some applications you might need to execute some actions after a change has happened on a document. Examples might be:
* A dependent document needs to be deleted. E.g. an annotation needs to be deleted when the main document was removed
* Some other document needs to be updated.  E.g. a song has been deleted and all playlists containing it need an update.
For that you can register a handler `onDocumentChange`. It is called after the change was committed to the database and clients have been informed about the changes, but before the change-initiating client has received the action response. It is important to consider that changes to the same or other collections within the handler will potentially itself result in `onDocumentChange` handler executions that will need to complete before the outer handler can finish.

```ts
// server side code
 amber().withCollection<MyEntity>("my-data",
    {
        onDocumentChange :async (tenant, userId, docId, oldDocument, newDocument, action, collections) =>{
            var childrenCollection = collections.getCollection<ChildEntity>("children")!;
            
            if (action == 'delete')
            { 
                // we need to delete all children that are related to this document.  
                for(var childId of oldDocument.children)
                {
                    await childrenCollection.deleteDocument(tenant, userId, childId);
                }
            }
        }
    });
```

The `userId` is attached to the change issued as a result of the original change. So that in those documents also have this user as the "`change_user`"

## Finding documents
When processing documents serverside, for example as an `onDocumentChanged`event handler, we need to address the documents we want to change or delete. Since the schema of the data is application specific and not known to the database, we do not have an optimized (in databases this equals to "indexed") way to retrieve the right documents apart from addressing it directly by `id`. We would need to read ALL documents (of a given `collection` and `tenant`), parse the json and apply some javascript predicate as a selector (function that returns a boolean). This would not scale since it moves all data through the database connection into the memory of the server application.
This is the reason why the only method to retrieve them serverside (the browser clients have a copy of the full collection anyways) is by using `allDocumentsByTags` to iterate over documents that contain all `tags`, you need to specify a minimum of one. These `tags` are calculated by a configured javascript handler called `tagsFromDocument`. It must return an array of string that we call `tags` and are added to the document in a searchable (that means optimized "indexed") way.

For example we have a collection with "books" and one with "annotations". The annotations belong to a book, but the book does not know about the annotations (a user who is allowed to create an annotation does not necessarily have the access to change the book). We can just expose the books `id` as a tag for an annotation. Now when a book is deleted, we can delete the annotations as well.

```ts
// server side code
interface AnnotationEntity{ bookId:string}
interface BookEntity{ title:string, author:string}

 amber()
 .withCollection<AnnotationEntity>("annotations",
 {
    // we tag it with the book that it belongs to
    tagsFromDocument : (doc) => [ doc.bookId ]
 })
 .withCollection<BookEntity>("books",
    {
        onDocumentChange :async (tenant, userId, docId, oldDocument, newDocument, action, collections) =>{
            
            if (action == 'delete')
            { 
                // we need to delete all annotations that are related to this document.  
                var annotations = collections.getCollection<AnnotationEntity>("annotations")!;

                // Find all annotations that are linked to the book
                annotations.allDocumentsByTags(tenant, [oldDocument.bookId], 
                async (id, annotation)=>{
                    // we found an annotation that is linked to the book that has been deleted. Delete it as well
                    await annotations.deleteDocument(tenant, userId, id);
                } );
            }
        }
    });
```

Amberbase does NOT provide an API to go through all documents in a non-optimized way. This MIGHT change if there are good examples that cannot be solved in an optimized way 😁.

## Synchronization catch up and local data
When setting up a new subscription for a collection on the browser client, you can provide the `change_number` of the last version that you have already in your local cache. With that you can for example store data locally in indexedDb os some other local storage. The same mechanism is used, behind the scenes, when the browser lost connectivity to the amberbase backend.

The setup process on the client side would look like this:

```ts
 // client side code
 var myDataCollection = connectionsApi.getCollection<MyEntity>("my-data");
 var myData: {entity:MyEntity, id:string}[] = [];
 // we load data from some local storage
 myData = localStorage.getItem("mydata");
 // we calculate the latest version (change number) from the data in the local storage
 let highestChangeNumber = Math.max(...myData.map(e=>e.changeNumer));
 myDataCollection.subscribe(
    highestChangeNumber, // we want to skip documents that we already have the latest version of
 (newOrUpdated)=>{ // handle new or updated records
    const existing = myData.findIndex((e) => e.id === newOrUpdated.id);
    if (existing) existing.entity = newOrUpdated.data;
    else myData.push({entity:newOrUpdated.data, id:newOrUpdated.id});
    localStorage.getItem("mydata", myData);
 }, 
 (deletedId)=>{ // handle removed records
    const index = myData.findIndex((d) => d.id === deletedId);
    if (index !== -1) {
        todos.value.splice(index, 1);
        localStorage.getItem("mydata", myData);
    }
 });
 connectionsApi.connect(); // start the synchronization
```

## Access rights management
By default, every user has access to the collection for `subscribe` (which equals the "read" since everyone who can subscribe gets access to the data), `update`, `create` and `delete` of documents. To implement proper access management we have three options, and can even combine them.

### Simple role to action mapping
The easiest way is to define a mapping from `roles` to primitive actions defined in [CollectionAccessAction](api/backend/type-aliases/CollectionAccessAction.md). This looks like the following:
```ts
// server side code

 amber()
 .withCollection<BookEntity>("books",
    {
        accessRights : {
            // the role "editor" allows all actions
            "editor" : ["subscribe", "update", "delete", "create"],
            // visitors can only read (subscribe)
            "visitor": ["subscribe"]
        }
    });
```

### Access rights check with code
A more powerful option is to define a javascript handler to return the result of the access decision. Since the mapping and the handler are mutually exclusive, the same property `accessRights` is used, but this time defined as a javascript lambda.
```ts
// server side code

 amber()
 .withCollection<BookEntity>("books",
    {
        accessRights : (user, book, action) => {
                if(action == 'create') 
                {
                  return user.roles?.includes("editor");
                }
                if(action == 'subscribe') 
                {
                  return user.roles?.includes("reader") || user.roles?.includes("editor");
                }
                if(action == 'delete'  || action == 'update') 
                {
                  // only the author can update or delete the book
                  return book?.author == user.userId;
                }
              },
    });
```

### Row based access control with access tags
The two other methods are great, as long as every user who can in general view a document, should be able to see all documents in a collection. But what about private data? Or groups of documents where you need special permissions for? 
The concept of `access tags` is meant for these cases. The idea is, that once the `access tags` are used a user needs to have at least one `access tag` in common between him/herself and the documents that he or she can see. For that we derive a list of `access tags` via some javascript handler from the users as well as from the documents. Let's assume books can be `public` and be seen by everyone, or just visible to the author.

```ts
// server side code
 interface BookEntity{ title:string, author:string, public:boolean}
 amber()
 .withCollection<BookEntity>("books",
    {
        accessRights : (user, book, action) => { /** same as before */},
        accessTagsFromDocument : (book) =>{
            var tags = [book.author]; // the author can always see it
            if (book.public) tags.push("public"); // public books are tagged with "public" as well
            return tags;
        },
        accessTagsFromUser : (user) => [user.userId, "public"] // every user can see "public" and whatever is tagged with their own user-id
    });
```

It usually makes sense to combine the `access tags` concept with a code based `accessRights` calculation, to compare the properties of the document that protects it from being viewed in the case that it is updated or deleted.

