import React from 'react'
import { Tree as AntTree } from 'antd';
import { AntTreeNode, AntTreeNodeSelectedEvent, AntTreeNodeDropEvent, AntTreeNodeMouseEvent } from 'antd/lib/tree/Tree'
import Dropdown from '../dropdown/Dropdown'

/**
 * 节点数据信息
 */
export type TreeNodeData = {
    // 唯一的key
    key: string
    // 标题
    title: string
    // 原数据信息
    dataRef: any
    // 子节点数据
    children: TreeNodeData[],
}

type Props = {
    /**
     * 装载子节点数据
     * @param node 请求的数据，如果是第一次加载则数据为undefined
     * @returns 必须返回统一的 TreeNodeData 结构
     */
    loadData: (node: TreeNodeData | undefined) => Promise<TreeNodeData[]>

    /**
     * 节点前添加 Checkbox 复选框
     */
    checkable?: boolean

    /**
     * 选中的key,表示当前Tree中设置选中状态
     */
    checkedKeys?: string[]

    /**
     * 右键菜单的信息列表
     */
    contextMenu?: JSX.Element[]

    /**
     * 渲染节点title的时候触发的事件，返回一个新的title对象
     * @param data 当前树状节点的数据
     * @param render 当前渲染的节点数据
     */
    onRenderTreeNodeTitle?: (data: TreeNodeData) => string | React.ReactNode,

    /**
     * 点击树节点触发的事件
     * @param data 当前节点的数据信息
     * @param selected 当前节点是否选中，true表示选中，false表示不选中
     */
    onTreeNodeClick?: (data: TreeNodeData, selected: boolean) => void

    /**
     * 点击右键菜单
     * - node.props.dataRef 可获取绑定的数据
     */
    onClickContextMenu?: (key: string | number, node?: AntTreeNode) => void

    onRightClick?: (options: AntTreeNodeMouseEvent) => boolean

    /**
     * 拖动Tree的节点触发的事件
     * @param  源数据
     * @param  目标数据
     */
    onDrag?: (dropEven: AntTreeNodeDropEvent) => Promise<boolean>,
}

type State = {
    treeData: TreeNodeData[]
    pageX: number
    pageY: number
    isShowMenu: boolean,
    node?: AntTreeNode,
}

/**
 * 树形组件
 */
export class Tree extends React.Component<Props, State>{

    static defaultProps = {
        checkable: false,
        checkedKeys: [],
        onRightClick: async() => true,
    }

    state = {
        treeData: [],
        pageX: 0,
        pageY: 0,
        isShowMenu: false,
        node: undefined,
    }

    constructor(props: Props) {
        super(props)
        this.onLoadData = this.onLoadData.bind(this)
    }

    componentDidMount() {
        this.props.loadData(undefined).then((treeData: TreeNodeData[]) => {
            this.setState({
                treeData,
            })
        })
    }

    render() {
        return (
            <>
                <AntTree
                    loadData={this.onLoadData}
                    checkedKeys={this.props.checkedKeys}
                    checkable={this.props.checkable}
                    onRightClick={(e) => {
                        const self = this
                        if (this.props.onRightClick) {
                            const respState = this.props.onRightClick(e)
                            if (respState) {
                                self.setState({
                                    pageX: e.event.clientX,
                                    pageY: e.event.clientY,
                                    isShowMenu: true,
                                    node: e.node,
                                })
                            }
                        }else {
                            this.setState({
                                pageX: e.event.clientX,
                                pageY: e.event.clientY,
                                isShowMenu: true,
                                node: e.node,
                            })
                        }
                    }}
                    onSelect={(_selectedKeys: string[], e: AntTreeNodeSelectedEvent) => {
                        if (this.props.onTreeNodeClick) {
                            this.props.onTreeNodeClick(e.node.props.dataRef, e.selected!)
                        }
                    }}
                    draggable={this.props.onDrag ? true : false}
                    onDrop={(dropEven: AntTreeNodeDropEvent) => {
                        if (this.props.onDrag) {
                            this.props.onDrag(dropEven).then((respState) => {
                                if (respState) {
                                    const loop = (datas: TreeNodeData[], callback: (data: TreeNodeData) => TreeNodeData[]) => {
                                        const newDatas: TreeNodeData[] = []
                                        datas.forEach((element) => {
                                            const callbackData = callback(element)
                                            if (element.children && element.children.length > 0) {
                                                if (callbackData) {
                                                    callbackData.forEach((callbackElement) => {
                                                        newDatas.push({
                                                            ...callbackElement,
                                                            children: loop(callbackElement.children, callback),
                                                        })
                                                    })
                                                }
                                            } else {
                                                if (callbackData) {
                                                    callbackData.forEach((callbackElement) => {
                                                        newDatas.push(callbackElement)
                                                    })
                                                }
                                            }
                                        })
                                        return newDatas
                                    }

                                    const filteTreeData = loop(this.state.treeData, (element: TreeNodeData) => {
                                        if (element.key === dropEven.dragNode.props.dataRef.key) {
                                            return []
                                        }
                                        return [{
                                            ...element,
                                        }]
                                    })

                                    const newTreeData = loop(filteTreeData, (element: TreeNodeData) => {
                                        if (element.key === dropEven.node.props.dataRef.key) {
                                            const dragNode = dropEven.dragNode.props.dataRef
                                            if (dropEven.dropPosition === -1) {
                                                return [dragNode, element]
                                            }
                                            if (dropEven.dropToGap) {
                                                return [element, dragNode]
                                            }
                                            return [{
                                                ...element,
                                                children: [
                                                    ...element.children,
                                                    dragNode,
                                                ],
                                            }]
                                        }
                                        return [element]
                                    })

                                    this.setState({
                                        treeData: newTreeData,
                                    })
                                }
                            })
                        }

                    }}
                >
                    {this.renderTreeNodes(this.state.treeData)}
                </AntTree>
                <Dropdown
                    visible={this.state.isShowMenu}
                    left={this.state.pageX}
                    top={this.state.pageY}
                    onBlur={() => {
                        this.setState({
                            isShowMenu: false,
                        })
                    }}
                    menus={this.props.contextMenu}
                    onClick={(element) => {
                        if (this.props.onClickContextMenu) {
                            if (element.key) {
                                this.props.onClickContextMenu(element.key, this.state.node)
                            } else {
                                throw new Error(`KOTOMI-TABLE-5003: The key attribute of ContextMenu element cannot be empty. key [${element.key}] `)
                            }
                        }
                        this.setState({
                            isShowMenu: false,
                        })
                    }}
                />
            </>
        )
    }

    // 装载节点数据
    protected async onLoadData(node: AntTreeNode) {
        const children = await this.props.loadData(node.props.dataRef)
        if (children && children.length > 0) {
            node.props.dataRef.children = children
            this.setState({
                treeData: [...this.state.treeData],
            });
        }
    }

    // 渲染所有节点数据
    protected renderTreeNodes = (treeData: TreeNodeData[]) => {
        return treeData.map(item => {
            let title: string | React.ReactNode = item.title

            if (this.props.onRenderTreeNodeTitle) {
                title = this.props.onRenderTreeNodeTitle(item)
            }
            if (item.children) {
                return (
                    <AntTree.TreeNode title={title} key={item.key} dataRef={item}>
                        {this.renderTreeNodes(item.children)}
                    </AntTree.TreeNode>
                )
            }
            return <AntTree.TreeNode title={title} key={item.key} dataRef={item} />;
        })
    }
}
