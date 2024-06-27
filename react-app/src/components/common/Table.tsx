import * as React from 'react';
import {DataGrid, GridColDef} from '@mui/x-data-grid';


export default function DataTable({rows, ...extraProps}) {
  
  const calculateAvgFieldLength = (fieldName: string): number => {
    return rows.reduce((acc, curr) => acc + curr[fieldName].length, 0) / rows.length;
  };
  
  const columns: GridColDef[] = Object.keys(rows[0]).map((fieldName: string) => {
    return {
      field: fieldName,
      headerName: fieldName.slice(0, 1).toUpperCase() + fieldName.slice(1),
      // width: calculateAvgFieldLength(fieldName) * 20,
    };
  });
  
  rows = rows.map((row, index) => {
    return {
      ...row,
      id: index,
    };
  });
  
  return (
    // <div style={{height: 400, width: '100%'}}>
      <DataGrid
        rows={rows}
        columns={columns}
        // initialState={{
        //   pagination: {
        //     paginationModel: {page: 0, pageSize: 5},
        //   },
        // }}
        // pageSizeOptions={[5, 10]}
        // checkboxSelection
        autoHeight={true}
        autoPageSize={true}
        autosizeOnMount={true}
        density="compact"
        disableAutosize={false}
        hideFooter={true}
        {...extraProps}
      />
    // </div>
  );
}