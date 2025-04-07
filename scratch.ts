export function createBlock({
    inputType: ,
    render(){
        fields.map(field => {
            switch(field.type){
                case 'string':
                    return <input type="text" />
                case 'select':
                    return <select>
                        
            }
    }
}){
    
}


export function createRenderer({
    blocks: {
        form: createBlock()
    }
}) {

    return {
        render(chain){

        }
    }
}



const {render} = createRenderer({
    block: createBlock({
      
    })
})

render({
    block: 'form',
    props: {
        title: 'thing'
        fields: [{
            label: 'name',
            name: 'name',
            type: 'string',
            required: true
        },
        {
            label: 'sender',
            name: 'sender',
            type: 'select',
            required: true,
            options: [
                {
                    label: 'bob',
                    value: 'bob@gmail.com'
                },
                {
                    label: 'alice',
                    value: 'alice@gmail.com'
                }
            ]
        },
        {
            label: 'to',
            name: 'to',
            type: 'search-select',
            required: true,
            options: {
                action: 'getUsers',
                params: {
                    query: 'work',
                    limit: 10,
                    
                }
            }
        },
        {
            
        }
    ]
    }
})