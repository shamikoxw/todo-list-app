function App() {
    const { Container, Row, Col } = ReactBootstrap;
    return (
        <Container>
            <Row>
                <Col md={{ offset: 3, span: 6 }}>
                    <TodoListCard />
                </Col>
            </Row>
        </Container>
    );
}

function TodoListCard() {
    const [items, setItems] = React.useState(null);
    const [searchTerm, setSearchTerm] = React.useState('');

    React.useEffect(() => {
        fetch('/items')
            .then(r => r.json())
            .then(setItems);
    }, []);

    const onNewItem = React.useCallback(
        newItem => {
            setItems([...items, newItem]);
        },
        [items],
    );

    const onItemUpdate = React.useCallback(
        item => {
            const index = items.findIndex(i => i.id === item.id);
            setItems([
                ...items.slice(0, index),
                item,
                ...items.slice(index + 1),
            ]);
        },
        [items],
    );

    const onItemRemoval = React.useCallback(
        item => {
            const index = items.findIndex(i => i.id === item.id);
            setItems([...items.slice(0, index), ...items.slice(index + 1)]);
        },
        [items],
    );

    // 过滤项目
    const filteredItems = items ? items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) : [];

    if (items === null) return 'Loading...';

    return (
        <React.Fragment>
            <AddItemForm onNewItem={onNewItem} />
            <SearchBox searchTerm={searchTerm} onSearchChange={setSearchTerm} />
            {filteredItems.length === 0 && items.length > 0 && (
                <p className="text-center text-muted">没有找到匹配的待办事项。</p>
            )}
            {filteredItems.length === 0 && items.length === 0 && (
                <p className="text-center">还没有待办事项！请在上面添加一个！</p>
            )}
            {filteredItems.map(item => (
                <ItemDisplay
                    item={item}
                    key={item.id}
                    onItemUpdate={onItemUpdate}
                    onItemRemoval={onItemRemoval}
                />
            ))}
        </React.Fragment>
    );
}

function AddItemForm({ onNewItem }) {
    const { Form, InputGroup, Button } = ReactBootstrap;

    const [newItem, setNewItem] = React.useState('');
    const [submitting, setSubmitting] = React.useState(false);

    const submitNewItem = e => {
        e.preventDefault();
        setSubmitting(true);
        fetch('/items', {
            method: 'POST',
            body: JSON.stringify({ name: newItem }),
            headers: { 'Content-Type': 'application/json' },
        })
            .then(r => r.json())
            .then(item => {
                onNewItem(item);
                setSubmitting(false);
                setNewItem('');
            });
    };

    return (
        <Form onSubmit={submitNewItem}>
            <InputGroup className="mb-3">
                <Form.Control
                    value={newItem}
                    onChange={e => setNewItem(e.target.value)}
                    type="text"
                    placeholder="New Item"
                    aria-describedby="basic-addon1"
                />
                <InputGroup.Append>
                    <Button
                        type="submit"
                        variant="success"
                        disabled={!newItem.length}
                        className={submitting ? 'disabled' : ''}
                    >
                        {submitting ? 'Adding...' : 'Add Item'}
                    </Button>
                </InputGroup.Append>
            </InputGroup>
        </Form>
    );
}

function SearchBox({ searchTerm, onSearchChange }) {
    const { Form, InputGroup, Button } = ReactBootstrap;

    const clearSearch = () => {
        onSearchChange('');
    };

    return (
        <Form className="search-box">
            <InputGroup>
                <InputGroup.Prepend>
                    <InputGroup.Text>
                        <i className="fa fa-search" />
                    </InputGroup.Text>
                </InputGroup.Prepend>
                <Form.Control
                    value={searchTerm}
                    onChange={e => onSearchChange(e.target.value)}
                    type="text"
                    placeholder="搜索待办事项..."
                    aria-describedby="search-addon"
                />
                {searchTerm && (
                    <InputGroup.Append>
                        <Button
                            variant="outline-secondary"
                            onClick={clearSearch}
                            aria-label="Clear search"
                        >
                            <i className="fa fa-times" />
                        </Button>
                    </InputGroup.Append>
                )}
            </InputGroup>
        </Form>
    );
}

function ItemDisplay({ item, onItemUpdate, onItemRemoval }) {
    const { Container, Row, Col, Button, Form, InputGroup } = ReactBootstrap;
    const [isEditing, setIsEditing] = React.useState(false);
    const [editName, setEditName] = React.useState(item.name);
    const [isUpdating, setIsUpdating] = React.useState(false);

    const toggleCompletion = () => {
        fetch(`/items/${item.id}`, {
            method: 'PUT',
            body: JSON.stringify({
                name: item.name,
                completed: !item.completed,
            }),
            headers: { 'Content-Type': 'application/json' },
        })
            .then(r => r.json())
            .then(onItemUpdate);
    };

    const removeItem = () => {
        fetch(`/items/${item.id}`, { method: 'DELETE' }).then(() =>
            onItemRemoval(item),
        );
    };

    const startEditing = () => {
        setIsEditing(true);
        setEditName(item.name);
    };

    const cancelEditing = () => {
        setIsEditing(false);
        setEditName(item.name);
    };

    const saveEdit = () => {
        if (!editName.trim()) return;

        setIsUpdating(true);
        fetch(`/items/${item.id}`, {
            method: 'PUT',
            body: JSON.stringify({
                name: editName.trim(),
                completed: item.completed,
            }),
            headers: { 'Content-Type': 'application/json' },
        })
            .then(r => r.json())
            .then(updatedItem => {
                onItemUpdate(updatedItem);
                setIsEditing(false);
                setIsUpdating(false);
            })
            .catch(() => {
                setIsUpdating(false);
            });
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            saveEdit();
        } else if (e.key === 'Escape') {
            cancelEditing();
        }
    };

    if (isEditing) {
        return (
            <Container fluid className={`item editing ${item.completed && 'completed'}`}>
                <Row>
                    <Col xs={1} className="text-center">
                        <Button
                            className="toggles"
                            size="sm"
                            variant="link"
                            onClick={toggleCompletion}
                            aria-label={
                                item.completed
                                    ? 'Mark item as incomplete'
                                    : 'Mark item as complete'
                            }
                        >
                            <i
                                className={`far ${
                                    item.completed ? 'fa-check-square' : 'fa-square'
                                }`}
                            />
                        </Button>
                    </Col>
                    <Col xs={8}>
                        <InputGroup size="sm">
                            <Form.Control
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                onKeyDown={handleKeyPress}
                                disabled={isUpdating}
                                autoFocus
                            />
                        </InputGroup>
                    </Col>
                    <Col xs={3} className="text-center">
                        <Button
                            size="sm"
                            variant="success"
                            onClick={saveEdit}
                            disabled={!editName.trim() || isUpdating}
                            className="me-1"
                        >
                            <i className="fa fa-check" />
                        </Button>
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={cancelEditing}
                            disabled={isUpdating}
                        >
                            <i className="fa fa-times" />
                        </Button>
                    </Col>
                </Row>
            </Container>
        );
    }

    return (
        <Container fluid className={`item ${item.completed && 'completed'}`}>
            <Row>
                <Col xs={1} className="text-center">
                    <Button
                        className="toggles"
                        size="sm"
                        variant="link"
                        onClick={toggleCompletion}
                        aria-label={
                            item.completed
                                ? 'Mark item as incomplete'
                                : 'Mark item as complete'
                        }
                    >
                        <i
                            className={`far ${
                                item.completed ? 'fa-check-square' : 'fa-square'
                            }`}
                        />
                    </Button>
                </Col>
                <Col xs={9} className="name" onDoubleClick={startEditing} style={{ cursor: 'pointer' }}>
                    {item.name}
                </Col>
                <Col xs={2} className="text-center">
                    <Button
                        size="sm"
                        variant="link"
                        onClick={startEditing}
                        aria-label="Edit Item"
                        className="me-1"
                    >
                        <i className="fa fa-edit text-primary" />
                    </Button>
                    <Button
                        size="sm"
                        variant="link"
                        onClick={removeItem}
                        aria-label="Remove Item"
                    >
                        <i className="fa fa-trash text-danger" />
                    </Button>
                </Col>
            </Row>
        </Container>
    );
}

ReactDOM.render(<App />, document.getElementById('root'));
