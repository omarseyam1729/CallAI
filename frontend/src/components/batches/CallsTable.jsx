// src/components/batches/CallsTable.jsx
import React from "react";
import { Table, TableHead, TableRow, TableCell, TableBody, Chip, Accordion, AccordionSummary, AccordionDetails, Typography, Button, Stack } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import TriggerEvidence from "./TriggerEvidence";

export default function CallsTable({ calls, onDetach }) {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Call ID</TableCell>
          <TableCell>Status</TableCell>
          <TableCell>Summary</TableCell>
          <TableCell>Triggers</TableCell>
          <TableCell width={120} align="right">Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {calls.map((c) => (
          <TableRow key={c.call_id}>
            <TableCell sx={{ fontFamily: "monospace" }}>{c.call_id}</TableCell>
            <TableCell>
              <Chip size="small" label={c.status || "-"} color={c.status==="succeeded"?"success":c.status==="failed"?"error":"default"} variant="outlined"/>
            </TableCell>
            <TableCell>
              <Accordion disableGutters elevation={0}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography variant="body2">View</Typography></AccordionSummary>
                <AccordionDetails><pre style={{fontSize:13}}>{c.summary ? JSON.stringify(c.summary,null,2) : "-"}</pre></AccordionDetails>
              </Accordion>
            </TableCell>
            <TableCell>
              {c.triggers?.length ? (
                <Accordion disableGutters elevation={0}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography variant="body2">{c.triggers.length} hit(s)</Typography></AccordionSummary>
                  <AccordionDetails>
                    <Stack>{c.triggers.map((t,i)=><TriggerEvidence key={i} t={t}/>)}</Stack>
                  </AccordionDetails>
                </Accordion>
              ) : "-"}
            </TableCell>
            <TableCell align="right">
              <Button size="small" color="error" startIcon={<LinkOffIcon />} onClick={()=>onDetach([c.call_id])}>Detach</Button>
            </TableCell>
          </TableRow>
        ))}
        {!calls.length && <TableRow><TableCell colSpan={5}>No calls attached yet.</TableCell></TableRow>}
      </TableBody>
    </Table>
  );
}
