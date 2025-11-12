'use client';
import { css } from '@linaria/core';
import {
  Announcer,
  Badge,
  Box,
  Button,
  Checkbox,
  Chip,
  Col,
  CurrencyInput,
  Drawer,
  Dropdown,
  EmptyState,
  Grid,
  Input,
  InputGroup,
  Popup,
  MultiSearchDropdown,
  RadioButton,
  RowItem,
  SearchInput,
  ShapeIcon,
  Slider,
  Snack,
  Tab,
  Tabs,
  TagCloud,
  TextArea,
  ToggleSwitch,
  Tooltip,
} from 'clad-ui';
import { PaymentInfo } from 'clad-ui/icons';
import { sx } from 'clad-ui/utils';
import type { ChangeEvent } from 'react';
import { useState } from 'react';
import theme from 'clad-ui/theme';

// scoped class-based CSS

const detailViewClass = css`
  background-color: ${theme.colors.backgroundPrimary};

  ${sx({
    px: 'sm',
    py: 'lg',
  })}
`;

const spacer = css`
  ${sx({
    my: 'lg',
  })}
`;

const CladUiDemo = () => {
  const [valueSearch, setValueSearch] = useState([
    { data: { job: 'job A' }, html: 'Lao động phổ thông', text: 'Lao động phổ thông' },
    { data: { job: 'job B' }, html: 'Tạp vụ', text: 'Tạp vụ' },
  ]);
  const onSelect = (v: any) => {
    const temp = [...valueSearch, v];
    setValueSearch(temp);
  };

  const onClear = () => {
    setValueSearch([]);
  };
  const onRemoveOption = (deleted: any) => {
    const afterDeleteValues = valueSearch.filter((va) => va.data !== deleted.data);
    setValueSearch(afterDeleteValues);
  };
  const [value, setValue] = useState(0);
  const [valueDropdown, setValueDropdown] = useState('');
  const [term, setTerm] = useState('month');
  const [checked, setChecked] = useState(false);
  const [open, setOpen] = useState(false);
  return (
    <section className={detailViewClass}>
      {!open && <Button onClick={() => setOpen(true)}>Reopen Announcer</Button>}
      <Announcer
        btnLabel="Xem thêm"
        open={open}
        onClose={() => setOpen(false)}
        onButtonClick={() => setOpen(false)}
        type="info"
        compact
      >
        Chợ Tốt đang thực hiện nâng cấp hệ thống nên có thể ảnh hưởng tới một số tính năng liên quan
        đến quản lý và hiển thị tin đăng, chúng tôi sẽ cập nhật thông tin ngay khi hoàn thành. Xin
        lỗi Quý khách vì sự bất tiện này!
      </Announcer>
      <div className={spacer}>
        <Badge position="topRight" borderRadius="pill" label="999">
          <Button>Bagde</Button>
        </Badge>
        <Checkbox
          label={checked ? 'Checked' : 'Unchecked'}
          name="overview"
          onChange={() => setChecked(!checked)}
          checked={checked}
        />
        <RadioButton
          label="Unchecked"
          name="overview"
          onChange={() => setChecked(!checked)}
          value="1"
          checked={checked}
          width="buttonMaxWidth"
        />
        <ShapeIcon bg="backgroundPrimary" color="backgroundInverted" size="md">
          <PaymentInfo />
        </ShapeIcon>
        <Chip onClick={() => {}} onClose={() => {}} active>
          Nhà ở
        </Chip>
        <ToggleSwitch onChange={() => setChecked(!checked)} checked={checked} />
        <Tooltip hoverable text="Tooltip">
          <Button>Tooltip</Button>
        </Tooltip>
        <TagCloud
          label="Gear box"
          required
          options={[
            { value: 'automatic', label: 'Automatic' },
            { value: 'manual', label: 'Manual' },
            { value: 'semi', label: 'Semi-automatic' },
          ]}
          value={`${value}`}
          onChange={((e: any) => setValue(e.target.value)) as any}
        />
        <Button onClick={() => setOpen(true)}>Open Snack</Button>
        {open ? (
          <Snack onClose={() => setOpen(false)} desktopSize="md">
            Medium size Snack
          </Snack>
        ) : null}
        <Button onClick={() => setOpen(true)}>Open Drawer</Button>
        <Drawer
          open={open}
          onClose={() => setOpen(false)}
          onPrimaryButtonClick={() => setOpen(false)}
          title="Info color"
          primaryBtnLabel="Primary"
          primaryColor="info"
          secondaryBtnLabel="Secondary"
        >
          Override default closeIcon with <code>&lt;ArrowRight /&gt;</code> icon
        </Drawer>{' '}
        <Button onClick={() => setOpen(true)}>Open Popup</Button>
        <Popup
          open={open}
          img="https://cdn.chotot.com/admincentre/960_579.jpg"
          onClose={() => setOpen(false)}
          onPrimaryButtonClick={() => setOpen(false)}
          primaryBtnLabel="Primary Button"
          secondaryBtnLabel="Secondary Button"
          title="Popup title"
        >
          Multiline user message. Use \n to add line break. Popup content accepts both string and
          React components.
        </Popup>
      </div>

      <Slider
        value={value}
        min={0}
        max={100}
        onChange={((e: { value: number }) => setValue(e.value)) as any}
        inputField
        type="range"
      />

      <Box backgroundColor="background" color="text">
        <RowItem
          type="checkbox"
          icon={
            (
              <ShapeIcon bg="positive" color="buttonBlank" radius="circle" size="md">
                <PaymentInfo />
              </ShapeIcon>
            ) as any
          }
          name="borderVar"
          value="1"
          checked={checked}
          onChange={() => setChecked(!checked)}
        >
          Row with border none
        </RowItem>
      </Box>

      <Tabs variant="fullWidth" value={0}>
        <Tab as="a" active={!!value} value={0} label="Tất cả" />
        <Tab as="a" active={!!value} value={1} label="Cá nhân" />
        <Tab as="a" active={!!value} value={2} label="Bán chuyên" />
      </Tabs>

      <Dropdown
        value={valueDropdown}
        onChange={(e) => setValueDropdown(e.target.value)}
        label="Chọn tỉnh thành"
        options={[
          { value: 'hcm', label: 'Tp Hồ Chí Minh' },
          { value: 'hn', label: 'Hà Nội' },
        ]}
      />

      <Input
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setValue(parseInt(e.target.value, 10))}
        label="Label cum placeholder..."
      />

      <CurrencyInput
        allowNegativeValue
        value={value}
        onChange={(e) => setValue(parseInt(e.target.value, 10))}
        label="Amount (VND)"
      />

      <InputGroup>
        <CurrencyInput
          allowNegativeValue
          value={value}
          onChange={(e) => setValue(parseInt(e.target.value, 10))}
          label="Amount"
        />
        <Dropdown
          width="quarter"
          label=""
          value={term}
          options={[
            { value: 'year', label: 'per year' },
            { value: 'month', label: 'per month' },
          ]}
          onChange={(e) => setTerm(e.target.value)}
        />
        <Button color="positive" size="large">
          <PaymentInfo />
        </Button>
      </InputGroup>

      <TextArea
        id="with-helptext"
        label="TextArea label"
        value={value?.toString()}
        onChange={(e) => setValue(parseInt(e.target.value, 10))}
        helptext="Help text"
      />

      <SearchInput
        id="si-value-binding"
        label="Search used phones on Chợ Tốt"
        variant="input"
        onInput={() => {}}
        onSelect={() => {}}
        options={valueSearch}
        value={{ text: '', selected: null as any }}
      />

      <MultiSearchDropdown
        label="Ngành nghề có sẵn"
        options={valueSearch}
        onSelect={onSelect}
        value={valueSearch}
        onClearData={onClear}
        onRemoveOption={onRemoveOption}
        onChange={() => {}}
      />

      <EmptyState buttonLabel="Comback home" type="notFound" />

      <Grid className="g1fsg0ft" gutter="none" width="full">
        <Col>
          <Box color="text" backgroundColor="background" borderWidth="sm" padding="sm">
            Column
          </Box>
        </Col>
        <Col>
          <Box color="text" backgroundColor="background" borderWidth="sm" padding="sm">
            Column
          </Box>
        </Col>
        <Col>
          <Box color="text" backgroundColor="background" borderWidth="sm" padding="sm">
            Column
          </Box>
        </Col>
      </Grid>
    </section>
  );
};

export default CladUiDemo;
