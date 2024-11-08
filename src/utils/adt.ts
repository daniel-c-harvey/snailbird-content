
export class LinkedList<T> 
{
    head? : LinkedListNode<T>;
    tail? : LinkedListNode<T>;
    count : number;

    constructor()
    {
        this.head = undefined;
        this.tail = undefined;
        this.count = 0;
    }
    
    apply(apply : (data : T) => void) : void
    {
        if (this.head != undefined)
            this.traverse(this.head, apply);
    }

    private traverse(node : LinkedListNode<T>, map : (data : T) => void) : void
    {
        console.log(node.next != null);
        if (node.next !== undefined) {
            this.traverse(node.next, map);
        } 
        map(node.data);
    }

    add(data : T) : void
    {
        let node = new LinkedListNode<T>(data);

        if (this.count <= 0 || this.tail == undefined)
        {
            this.head = node;
            this.tail = node;
        }
        else
        {
            this.tail.next = node;
            this.tail = node;
        }
        this.count++;
    }
}


class LinkedListNode<T>
{
    data : T;
    next? : LinkedListNode<T>;
    // prev? : LinkedListNode<T>;

    constructor(data : T)
    {
        this.data = data;
        this.next = undefined;
        // this.prev = undefined;
    }
}