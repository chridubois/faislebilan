import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TablePagination,
  TextField,
  Box,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

function CustomTable({ columns, data, actions }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

  const filteredData = data.filter((row) => {
    return columns.some((column) => {
      const value = row[column.field];
      return value && value.toString().toLowerCase().includes(searchTerm);
    });
  });

  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="left" mb={2}>
        <Box display="flex" alignItems="center">
          <SearchIcon sx={{ marginRight: '8px' }} />
          <TextField
            label="Rechercher"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column.id}>{column.label}</TableCell>
              ))}
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row) => (
                <TableRow key={row.id}>
                  {columns.map((column) => (
                    <TableCell key={column.id}>{row[column.field]}</TableCell>
                  ))}
                  <TableCell>
                    {actions.map((action) => (
                      <Button
                        key={action.label}
                        variant="contained"
                        color={action.color || 'primary'}
                        onClick={() => action.onClick(row.id)}
                        sx={{ marginRight: 1 }}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={filteredData.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Lignes par page"
      />
    </>
  );
}

export default CustomTable;
