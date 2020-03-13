/**
 * title: 树结构表格
 * desc: 一个树结构的表格数据
 */

import React from 'react'
import { Table } from '../../components/index'

const BaseTable = () =>{
  return (
    <Table
      columns={[{
        dataIndex: 'name',
        title: '人员名称',
        width: 100
      },{
        dataIndex: 'six',
        title: '性别',
        width: 200
      },{
        dataIndex: 'age',
        title: '年龄',
        width: 200
      }]}
      loadData={async ({ page, pageSize })=>{
        const datas: any = []
        for(let i =0 ;i< pageSize ; i++){
          datas.push({
            id: i,
            name: `${page} - name - ${i} - 这是一个超出的文字内容`,
            six: `${page} - six - ${i}`,
            age: `${page} - age - ${i}`,
          })
        }
        return {
          dataSource: datas,
          total: 2000
        }
      }}
      onLoadChildren={async ()=>{
        return [{
          id: new Date().getTime() + 1,
          name: "name - 1",
          six: "six - 1",
          age: "$age - 1",
        },{
          id: new Date().getTime() + 2,
          name: "name - 2",
          six: "six - 2",
          age: "$age - 2",
          "$children": [],
        }]
      }}
    />
  )
}

export default BaseTable